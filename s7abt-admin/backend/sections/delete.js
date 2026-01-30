const db = require("./shared/db");
const response = require("./shared/response");
const { checkAuthorization } = require("./shared/authorize");

/**
 * Delete a section (hard delete)
 * Compatible with existing s7abt.com schema
 */
exports.handler = async (event) => {
  try {
    console.log("Delete section event:", JSON.stringify(event));

    // Check authorization - only admin and content_manager can delete sections
    const authError = checkAuthorization(event, "sections", "delete");
    if (authError) return authError;

    const sectionId = event.pathParameters?.id;

    if (!sectionId) {
      return response.validationError([
        { field: "id", message: "Section ID is required" },
      ]);
    }

    // 1. Check if section exists
    const existingSection = await db.queryOne(
      "SELECT s7b_section_id, s7b_section_title FROM s7b_section WHERE s7b_section_id = ? AND s7b_section_active = 1",
      [sectionId]
    );

    if (!existingSection) {
      return response.notFound("Section");
    }

    // 2. Check if section has articles (safety check)
    const articleCount = await db.queryOne(
      "SELECT COUNT(*) as count FROM s7b_article WHERE s7b_section_id = ?",
      [sectionId]
    );

    if (articleCount.count > 0) {
      return response.error(
        "Cannot delete section with existing articles",
        400,
        `This section has ${articleCount.count} article(s). Please reassign or delete them first.`
      );
    }

    // 3. Hard delete the section from the database
    await db.query("DELETE FROM s7b_section WHERE s7b_section_id = ?", [sectionId]);

    return response.success({
      id: parseInt(sectionId),
      message: "Section permanently deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting section:", error);
    return response.error("Failed to delete section", 500, error.message);
  }
};
