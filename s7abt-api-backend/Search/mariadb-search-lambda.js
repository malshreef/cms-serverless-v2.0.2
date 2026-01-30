const mysql = require("mysql2/promise");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

// --- Configuration ---
const SECRET_NAME = process.env.SECRET_NAME || "s7abt/database/credentials-dubai";
const smClient = new SecretsManagerClient({ region: process.env.AWS_REGION || "me-central-1" });

// --- Helper Functions ---

// Get database credentials from Secrets Manager
async function getDbCredentials() {
    try {
        const command = new GetSecretValueCommand({ SecretId: SECRET_NAME });
        const data = await smClient.send(command);
        if ("SecretString" in data) {
            return JSON.parse(data.SecretString);
        } else {
            let buff = Buffer.from(data.SecretBinary, "base64");
            return JSON.parse(buff.toString("ascii"));
        }
    } catch (error) {
        console.error("Failed to retrieve secrets:", error);
        throw new Error("Could not fetch database credentials from Secrets Manager.");
    }
}

// Build search query with MariaDB FULLTEXT
// Uses FULLTEXT index on s7b_article_title and s7b_article_description
// Also searches in div body fields via LIKE for comprehensive results
function buildSearchQuery(searchTerm, limit, offset, scope) {
    const escapedTerm = searchTerm.replace(/[+\-><()~*"@]/g, ' ').trim();
    const likeTerm = `%${searchTerm}%`;

    // Query using FULLTEXT on title + description, with LIKE fallback for body divs
    // Also returns concatenated div bodies for snippet extraction
    let sql = `
        SELECT
            a.s7b_article_id as id,
            a.s7b_article_title as title,
            a.s7b_article_description as brief,
            a.s7b_article_image as image,
            a.s7b_article_add_date as created_at,
            u.s7b_user_id as author_id,
            u.s7b_user_name as author_name,
            u.s7b_user_image as author_image,
            s.s7b_section_id as section_id,
            s.s7b_section_title as section_name,
            GROUP_CONCAT(DISTINCT t.s7b_tags_name) as tags,
            CONCAT(
                COALESCE(a.s7b_article_div1_body, ''),
                ' ',
                COALESCE(a.s7b_article_div2_body, ''),
                ' ',
                COALESCE(a.s7b_article_div3_body, '')
            ) as content,
            CASE
                WHEN MATCH(a.s7b_article_title, a.s7b_article_description) AGAINST(? IN NATURAL LANGUAGE MODE) > 0
                THEN MATCH(a.s7b_article_title, a.s7b_article_description) AGAINST(? IN NATURAL LANGUAGE MODE)
                ELSE 0.1
            END as relevance
        FROM s7b_article a
        LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
        LEFT JOIN s7b_section s ON a.s7b_section_id = s.s7b_section_id
        LEFT JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
        LEFT JOIN s7b_tags t ON ti.s7b_tags_id = t.s7b_tags_id
        WHERE
            a.s7b_article_active = 1
            AND a.s7b_article_deleted_at IS NULL
            AND (
                MATCH(a.s7b_article_title, a.s7b_article_description) AGAINST(? IN NATURAL LANGUAGE MODE)
                OR a.s7b_article_title LIKE ?
                OR a.s7b_article_description LIKE ?
                OR a.s7b_article_div1_body LIKE ?
                OR a.s7b_article_div2_body LIKE ?
                OR a.s7b_article_div3_body LIKE ?
                OR t.s7b_tags_name LIKE ?
            )
        GROUP BY a.s7b_article_id
        ORDER BY relevance DESC, a.s7b_article_add_date DESC
        LIMIT ? OFFSET ?
    `;

    return {
        sql,
        params: [
            escapedTerm, escapedTerm, escapedTerm,  // MATCH ... AGAINST (3 times)
            likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm,  // LIKE terms (6)
            parseInt(limit), parseInt(offset)
        ]
    };
}

// Build count query for pagination
function buildCountQuery(searchTerm, scope) {
    const escapedTerm = searchTerm.replace(/[+\-><()~*"@]/g, ' ').trim();
    const likeTerm = `%${searchTerm}%`;

    let sql = `
        SELECT COUNT(DISTINCT a.s7b_article_id) as total
        FROM s7b_article a
        LEFT JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
        LEFT JOIN s7b_tags t ON ti.s7b_tags_id = t.s7b_tags_id
        WHERE
            a.s7b_article_active = 1
            AND a.s7b_article_deleted_at IS NULL
            AND (
                MATCH(a.s7b_article_title, a.s7b_article_description) AGAINST(? IN NATURAL LANGUAGE MODE)
                OR a.s7b_article_title LIKE ?
                OR a.s7b_article_description LIKE ?
                OR a.s7b_article_div1_body LIKE ?
                OR a.s7b_article_div2_body LIKE ?
                OR a.s7b_article_div3_body LIKE ?
                OR t.s7b_tags_name LIKE ?
            )
    `;

    return {
        sql,
        params: [escapedTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm]
    };
}

// Strip HTML tags from text
function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Extract snippet around search term with context
function extractSnippet(content, searchTerm, contextLength = 100) {
    if (!content || !searchTerm) return '';

    // Strip HTML and normalize whitespace
    const plainText = stripHtml(content);
    const lowerText = plainText.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();

    // Find position of search term
    const index = lowerText.indexOf(lowerTerm);

    if (index === -1) {
        // Term not found in content, return first part of content
        return plainText.substring(0, contextLength * 2) + (plainText.length > contextLength * 2 ? '...' : '');
    }

    // Calculate start and end positions for snippet
    let start = Math.max(0, index - contextLength);
    let end = Math.min(plainText.length, index + searchTerm.length + contextLength);

    // Adjust to word boundaries
    if (start > 0) {
        const spaceIndex = plainText.indexOf(' ', start);
        if (spaceIndex !== -1 && spaceIndex < index) {
            start = spaceIndex + 1;
        }
    }

    if (end < plainText.length) {
        const spaceIndex = plainText.lastIndexOf(' ', end);
        if (spaceIndex !== -1 && spaceIndex > index + searchTerm.length) {
            end = spaceIndex;
        }
    }

    // Build snippet with ellipsis
    let snippet = '';
    if (start > 0) snippet += '...';
    snippet += plainText.substring(start, end);
    if (end < plainText.length) snippet += '...';

    return snippet;
}

// Format results to match existing API format
function formatResults(rows, searchTerm) {
    return rows.map(row => {
        // Try to find snippet in content first, then brief
        let snippet = '';
        const content = row.content || '';
        const brief = row.brief || '';

        // Check if search term is in title
        const titleHasMatch = row.title && row.title.toLowerCase().includes(searchTerm.toLowerCase());

        // Check if search term is in content
        const contentHasMatch = content && stripHtml(content).toLowerCase().includes(searchTerm.toLowerCase());

        // Check if search term is in brief
        const briefHasMatch = brief && brief.toLowerCase().includes(searchTerm.toLowerCase());

        if (contentHasMatch) {
            snippet = extractSnippet(content, searchTerm);
        } else if (briefHasMatch) {
            snippet = extractSnippet(brief, searchTerm, 150);
        } else if (titleHasMatch) {
            // If only in title, show beginning of content or brief
            snippet = stripHtml(content || brief).substring(0, 200);
            if ((content || brief).length > 200) snippet += '...';
        } else {
            // Fallback: show beginning of content or brief
            snippet = stripHtml(content || brief).substring(0, 200);
            if ((content || brief).length > 200) snippet += '...';
        }

        return {
            id: row.id,
            title: row.title,
            brief: row.brief || '',
            snippet: snippet,
            searchTerm: searchTerm,
            image: row.image || '',
            created_at: row.created_at,
            author: row.author_name ? {
                id: row.author_id,
                name: row.author_name,
                image: row.author_image
            } : null,
            section: row.section_name ? {
                id: row.section_id,
                name: row.section_name
            } : null,
            tags: row.tags ? row.tags.split(',') : [],
            relevance: row.relevance
        };
    });
}

// --- Lambda Handler ---
exports.handler = async (event) => {
    let connection;

    // CORS headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Content-Type": "application/json"
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Parse query parameters
        const params = event.queryStringParameters || {};
        const searchTerm = params.q || params.query || '';
        const limit = params.limit || 20;
        const offset = params.offset || 0;
        const scope = params.scope || 'all';

        // Validate search term
        if (!searchTerm || searchTerm.trim().length < 2) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Search term must be at least 2 characters",
                    data: { articles: [], total: 0 }
                })
            };
        }

        console.log(`Search request: term="${searchTerm}", limit=${limit}, offset=${offset}, scope=${scope}`);

        // Get DB credentials and connect
        const dbCreds = await getDbCredentials();
        connection = await mysql.createConnection({
            host: dbCreds.host,
            user: dbCreds.username,
            password: dbCreds.password,
            database: dbCreds.database || dbCreds.dbname,
        });

        // Execute search
        const searchQuery = buildSearchQuery(searchTerm, limit, offset, scope);
        const countQuery = buildCountQuery(searchTerm, scope);

        const [rows] = await connection.execute(searchQuery.sql, searchQuery.params);
        const [[countResult]] = await connection.execute(countQuery.sql, countQuery.params);
        const total = countResult.total;

        // Format results with snippet extraction
        const articles = formatResults(rows, searchTerm);

        console.log(`Found ${articles.length} results (total: ${total})`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: {
                    articles,
                    total,
                    pagination: {
                        offset: parseInt(offset),
                        limit: parseInt(limit),
                        total,
                        hasMore: (parseInt(offset) + articles.length) < total
                    }
                }
            })
        };

    } catch (error) {
        console.error("Search error:", error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: "Search failed",
                error: error.message
            })
        };

    } finally {
        if (connection) {
            await connection.end();
        }
    }
};
