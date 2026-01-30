const { CognitoIdentityProviderClient, ListUsersCommand, AdminCreateUserCommand, AdminDeleteUserCommand, AdminUpdateUserAttributesCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { success, error } = require('../shared/response');

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event));
    const method = event.httpMethod;
    const path = event.path;

    try {
        if (method === 'GET' && path.endsWith('/users')) {
            return await listUsers(event);
        } else if (method === 'POST' && path.endsWith('/users')) {
            return await createUser(event);
        } else if (method === 'DELETE') {
            return await deleteUser(event);
        } else if (method === 'PUT') {
            return await updateUser(event);
        }

        return error('Method not allowed', 405);
    } catch (err) {
        console.error('Error:', err);
        return error('Internal Server Error', 500, err.message);
    }
};

async function listUsers(event) {
    const command = new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        Limit: 60
    });

    const response = await client.send(command);

    const users = response.Users.map(user => {
        const attrs = {};
        user.Attributes.forEach(a => attrs[a.Name] = a.Value);
        return {
            id: user.Username,
            username: user.Username,
            email: attrs.email,
            name: attrs.name || attrs.given_name || user.Username,
            role: attrs['custom:role'] || 'writer', // Assuming custom attribute for role
            status: user.UserStatus,
            createdAt: user.UserCreateDate
        };
    });

    return success({ users });
}

async function createUser(event) {
    const body = JSON.parse(event.body);
    const { email, name, role, password } = body;

    if (!email) return error('Email is required', 400);

    const params = {
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'name', Value: name || email },
            { Name: 'custom:role', Value: role || 'writer' }
        ],
        MessageAction: 'SUPPRESS' // Don't send default email, we might want to send custom or just set password
    };

    if (password) {
        params.TemporaryPassword = password;
    }

    const command = new AdminCreateUserCommand(params);
    const response = await client.send(command);

    return success({
        message: 'User created successfully',
        user: {
            id: response.User.Username,
            email: email,
            role: role
        }
    });
}

async function deleteUser(event) {
    const userId = event.pathParameters.id;

    const command = new AdminDeleteUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: userId
    });

    await client.send(command);
    return success({ message: 'User deleted successfully' });
}

async function updateUser(event) {
    const userId = event.pathParameters.id;
    const body = JSON.parse(event.body);
    const { role, name } = body;

    const attributes = [];
    if (role) attributes.push({ Name: 'custom:role', Value: role });
    if (name) attributes.push({ Name: 'name', Value: name });

    if (attributes.length > 0) {
        const command = new AdminUpdateUserAttributesCommand({
            UserPoolId: USER_POOL_ID,
            Username: userId,
            UserAttributes: attributes
        });
        await client.send(command);
    }

    return success({ message: 'User updated successfully' });
}
