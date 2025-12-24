<?php
require_once 'functions.php';

class Auth {
    private $functions;

    public function __construct() {
        $this->functions = new VolunteerFunctions();
    }

    public function login($email, $password) {
        // Validate input
        if (empty($email) || empty($password)) {
            return ['success' => false, 'message' => 'Email and password are required'];
        }

        if (!$this->functions->validateEmail($email)) {
            return ['success' => false, 'message' => 'Invalid email format'];
        }

        // Get user
        $user = $this->functions->getUserByEmail($email);
        if (!$user) {
            return ['success' => false, 'message' => 'User not found'];
        }

        // Verify password
        if (!$this->functions->verifyPassword($password, $user['password_hash'])) {
            return ['success' => false, 'message' => 'Invalid password'];
        }

        // Set session
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_name'] = $user['full_name'];
        

        // Return user data (without password)
        unset($user['password_hash']);
        return [
            'success' => true,
            'message' => 'Login successful',
            'user' => $user
        ];
    }

    public function register($username, $email, $password, $full_name, $profile_bio = null) {
        // Validate required fields
        $required = ['username', 'email', 'password', 'full_name'];
        foreach ($required as $field) {
            if (empty($$field)) {
                return ['success' => false, 'message' => "$field is required"];
            }
        }

        // Validate email
        if (!$this->functions->validateEmail($email)) {
            return ['success' => false, 'message' => 'Invalid email format'];
        }

        // Check if user already exists
        if ($this->functions->userExists($email)) {
            return ['success' => false, 'message' => 'User already exists with this email'];
        }

        // Validate password strength
        if (strlen($password) < 6) {
            return ['success' => false, 'message' => 'Password must be at least 6 characters long'];
        }

        // Create user
        $user_id = $this->functions->createUser(
            username: $this->functions->sanitize($username),
            email: $this->functions->sanitize($email),
            password: $password,
            full_name: $this->functions->sanitize($full_name),
            profile_bio: $profile_bio ? $this->functions->sanitize($profile_bio) : null
        );

        if ($user_id) {
            return [
                'success' => true,
                'message' => 'User registered successfully',
                'user_id' => $user_id
            ];
        } else {
            return ['success' => false, 'message' => 'Registration failed'];
        }
    }

    public function checkAuth() {
        if (isset($_SESSION['user_id'])) {
            return [
                'authenticated' => true,
                'user' => [
                    'user_id' => $_SESSION['user_id'],
                    'full_name' => $_SESSION['user_name'],
                    'email' => $_SESSION['user_email']
                    
                ]
            ];
        }
        return ['authenticated' => false];
    }

    public function logout() {
        session_destroy();
        return ['success' => true, 'message' => 'Logged out successfully'];
    }
}
?>