<?php
require_once __DIR__ . '/../config/database.php';

class VolunteerFunctions {
    private $conn;
    private $db;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    // Sanitize input data
    public function sanitize($data) {
        return htmlspecialchars(strip_tags(trim($data)));
    }

    // Validate email
    public function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL);
    }

    // Hash password
    public function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    // Verify password
    public function verifyPassword($password, $hashed_password) {
        return password_verify($password, $hashed_password);
    }

    // Check if user exists
    public function userExists($email) {
        $query = "SELECT user_id FROM USER WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    // Create user
    public function createUser($username, $email, $password, $full_name, $role = 'volunteer', $profile_bio = null) {
        $query = "INSERT INTO USER SET username = :username, email = :email, password_hash = :password_hash, full_name = :full_name, profile_bio = :profile_bio, created_at = NOW()";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":username", $username);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":full_name", $full_name);
        
        $stmt->bindParam(":profile_bio", $profile_bio);
        
        // Hash password
        $hashed_password = $this->hashPassword($password);
        $stmt->bindParam(":password_hash", $hashed_password);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Get user by email
    public function getUserByEmail($email) {
        $query = "SELECT user_id, username, email, password_hash, full_name, profile_bio, created_at FROM USER WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        
        if ($stmt->rowCount() == 1) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return false;
    }

    // Get all events (opportunities)

    // Register for event
    public function registerForEvent($user_id, $event_id) {
        // Check if already registered
        $check_query = "SELECT registration_id FROM VOLUNTEER_REGISTRATION WHERE user_id = :user_id AND event_id = :event_id";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(":user_id", $user_id);
        $check_stmt->bindParam(":event_id", $event_id);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            return false; // Already registered
        }

        $query = "INSERT INTO VOLUNTEER_REGISTRATION SET user_id = :user_id, event_id = :event_id, status = 'pending', registered_at = NOW()";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":event_id", $event_id);
        
        return $stmt->execute();
    }

    // Get user registrations
    public function getUserRegistrations($user_id) {
        $query = "SELECT e.title, e.location, e.start_datetime, vr.status, vr.registered_at 
                  FROM VOLUNTEER_REGISTRATION vr 
                  JOIN EVENT e ON vr.event_id = e.event_id 
                  WHERE vr.user_id = :user_id 
                  ORDER BY vr.registered_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Create blog post
    public function createBlogPost($title, $content, $author_id) {
        $query = "INSERT INTO BLOG SET title = :title, content = :content, author_id = :author_id, created_at = NOW(), updated_at = NOW()";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":title", $title);
        $stmt->bindParam(":content", $content);
        $stmt->bindParam(":author_id", $author_id);
        
        return $stmt->execute();
    }

    // Get all blog posts
    public function getBlogPosts() {
        $query = "SELECT b.*, u.full_name as author_name 
                  FROM BLOG b 
                  JOIN USER u ON b.author_id = u.user_id 
                  ORDER BY b.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }



public function getUserCountByRole($role) {
    $query = "SELECT COUNT(*) as count FROM USER WHERE role = :role";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':role', $role);
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC)['count'];
}

public function getEventCountByStatus($status) {
    $query = "SELECT COUNT(*) as count FROM EVENT WHERE status = :status";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':status', $status);
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC)['count'];
}

public function getTotalReportsCount() {
    $query = "SELECT COUNT(*) as total FROM REPORT";
    $stmt = $this->conn->prepare($query);
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC)['total'];
}

public function getReportCountByStatus($status) {
    $query = "SELECT COUNT(*) as count FROM REPORT WHERE status = :status";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':status', $status);
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC)['count'];
}

public function getAllReports($status = 'all') {
    $query = "SELECT * FROM REPORT WHERE 1=1";
    
    if ($status !== 'all') {
        $query .= " AND status = :status";
    }
    
    $query .= " ORDER BY reported_at DESC";
    
    $stmt = $this->conn->prepare($query);
    if ($status !== 'all') {
        $stmt->bindParam(':status', $status);
    }
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Get user registrations for a specific event
public function getEventRegistrations($event_id) {
    $query = "SELECT vr.*, u.username, u.full_name, u.email 
              FROM VOLUNTEER_REGISTRATION vr 
              JOIN USER u ON vr.user_id = u.user_id 
              WHERE vr.event_id = :event_id 
              ORDER BY vr.registered_at DESC";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':event_id', $event_id, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Update registration status
public function updateRegistrationStatus($registration_id, $status) {
    $query = "UPDATE VOLUNTEER_REGISTRATION SET status = :status WHERE registration_id = :registration_id";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':registration_id', $registration_id, PDO::PARAM_INT);
    return $stmt->execute();
}

// Get comments for a blog post
public function getBlogComments($blog_id) {
    $query = "SELECT c.*, u.username, u.full_name 
              FROM COMMENT c 
              JOIN USER u ON c.user_id = u.user_id 
              WHERE c.blog_id = :blog_id 
              ORDER BY c.created_at DESC";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':blog_id', $blog_id, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Delete comment
public function deleteComment($comment_id) {
    $query = "DELETE FROM COMMENT WHERE comment_id = :comment_id";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':comment_id', $comment_id, PDO::PARAM_INT);
    return $stmt->execute();
}

// Get all comments with pagination
public function getAllComments($page = 1, $per_page = 10) {
    $offset = ($page - 1) * $per_page;
    $query = "SELECT c.*, u.username, u.full_name, b.title as blog_title 
              FROM COMMENT c 
              JOIN USER u ON c.user_id = u.user_id 
              JOIN BLOG b ON c.blog_id = b.blog_id 
              ORDER BY c.created_at DESC 
              LIMIT :offset, :per_page";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->bindParam(':per_page', $per_page, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Get total comments count
public function getTotalComments() {
    $query = "SELECT COUNT(*) as total FROM COMMENT";
    $stmt = $this->conn->prepare($query);
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC)['total'];
}

// Search users
public function searchUsers($search_term) {
    $query = "SELECT user_id, username, email, full_name, role, created_at 
              FROM USER 
              WHERE username LIKE :search OR email LIKE :search OR full_name LIKE :search 
              ORDER BY created_at DESC";
    $stmt = $this->conn->prepare($query);
    $search_term = "%$search_term%";
    $stmt->bindParam(':search', $search_term);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Search events
public function searchEvents($search_term) {
    $query = "SELECT e.*, u.full_name as organizer_name 
              FROM EVENT e 
              LEFT JOIN USER u ON e.created_by = u.user_id 
              WHERE e.title LIKE :search OR e.description LIKE :search OR e.location LIKE :search 
              ORDER BY e.created_at DESC";
    $stmt = $this->conn->prepare($query);
    $search_term = "%$search_term%";
    $stmt->bindParam(':search', $search_term);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Get events by organizer
public function getEventsByOrganizer($user_id) {
    $query = "SELECT e.*, u.full_name as organizer_name 
              FROM EVENT e 
              LEFT JOIN USER u ON e.created_by = u.user_id 
              WHERE e.created_by = :user_id 
              ORDER BY e.created_at DESC";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Get user activity stats
public function getUserActivityStats($user_id) {
    $stats = [];
    
    // Events created
    $query = "SELECT COUNT(*) as count FROM EVENT WHERE created_by = :user_id";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    $stats['events_created'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Events registered for
    $query = "SELECT COUNT(*) as count FROM VOLUNTEER_REGISTRATION WHERE user_id = :user_id";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    $stats['events_registered'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Blog posts
    $query = "SELECT COUNT(*) as count FROM BLOG WHERE author_id = :user_id";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    $stats['blog_posts'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Comments
    $query = "SELECT COUNT(*) as count FROM COMMENT WHERE user_id = :user_id";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    $stats['comments'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    return $stats;
}

// Get monthly registration stats
public function getMonthlyRegistrationStats($year = null) {
    if ($year === null) {
        $year = date('Y');
    }
    
    $query = "SELECT MONTH(created_at) as month, COUNT(*) as count 
              FROM USER 
              WHERE YEAR(created_at) = :year 
              GROUP BY MONTH(created_at) 
              ORDER BY month";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':year', $year);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Get event participation stats
public function getEventParticipationStats() {
    $query = "SELECT e.title, COUNT(vr.registration_id) as participants 
              FROM EVENT e 
              LEFT JOIN VOLUNTEER_REGISTRATION vr ON e.event_id = vr.event_id 
              GROUP BY e.event_id 
              ORDER BY participants DESC 
              LIMIT 10";
    $stmt = $this->conn->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Add these methods to the VolunteerFunctions class

// Get recent blog posts with limit
public function getRecentBlogs($limit = 5) {
    $query = "SELECT b.*, u.username, u.full_name, u.profile_bio,
                     (SELECT COUNT(*) FROM COMMENT c WHERE c.blog_id = b.blog_id) as comment_count
              FROM BLOG b 
              JOIN USER u ON b.author_id = u.user_id 
              ORDER BY b.created_at DESC 
              LIMIT :limit";
    
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Get user statistics
public function getUserStats($user_id) {
    $stats = [];
    
    // Total events registered
    $query = "SELECT COUNT(*) as total_registrations 
              FROM VOLUNTEER_REGISTRATION 
              WHERE user_id = :user_id";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(":user_id", $user_id);
    $stmt->execute();
    $stats['total_registrations'] = $stmt->fetch(PDO::FETCH_ASSOC)['total_registrations'];
    
    // Confirmed registrations
    $query = "SELECT COUNT(*) as confirmed_registrations 
              FROM VOLUNTEER_REGISTRATION 
              WHERE user_id = :user_id AND status = 'confirmed'";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(":user_id", $user_id);
    $stmt->execute();
    $stats['confirmed_registrations'] = $stmt->fetch(PDO::FETCH_ASSOC)['confirmed_registrations'];
    
    // Blog posts count
    $query = "SELECT COUNT(*) as blog_posts 
              FROM BLOG 
              WHERE author_id = :user_id";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(":user_id", $user_id);
    $stmt->execute();
    $stats['blog_posts'] = $stmt->fetch(PDO::FETCH_ASSOC)['blog_posts'];
    
    return $stats;
}



// Add comment to blog
public function addComment($content, $user_id, $blog_id) {
    $query = "INSERT INTO COMMENT SET content = :content, user_id = :user_id, blog_id = :blog_id, created_at = NOW()";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(":content", $content);
    $stmt->bindParam(":user_id", $user_id);
    $stmt->bindParam(":blog_id", $blog_id);
    
    return $stmt->execute();
}

// Add this method to the VolunteerFunctions class

// Update event statuses based on current time
public function updateEventStatuses() {
    $now = date('Y-m-d H:i:s');
    
    // Update ongoing events
    $query = "UPDATE EVENT SET status = 'ongoing' 
              WHERE status = 'upcoming' 
              AND start_datetime <= :now 
              AND end_datetime >= :now";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(":now", $now);
    $stmt->execute();
    
    // Update completed events
    $query = "UPDATE EVENT SET status = 'completed' 
              WHERE status IN ('upcoming', 'ongoing') 
              AND end_datetime < :now";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(":now", $now);
    $stmt->execute();
}

// Get events with updated status mapping
public function getEvents($filters = []) {
    $query = "SELECT e.*, u.full_name as organizer_name 
              FROM EVENT e 
              LEFT JOIN USER u ON e.created_by = u.user_id 
              WHERE 1=1";
    $params = [];

    if (!empty($filters['status'])) {
        if (is_array($filters['status'])) {
            $placeholders = implode(',', array_fill(0, count($filters['status']), '?'));
            $query .= " AND e.status IN ($placeholders)";
            $params = array_merge($params, $filters['status']);
        } else {
            $query .= " AND e.status = :status";
            $params[':status'] = $filters['status'];
        }
    }

    if (!empty($filters['location'])) {
        $query .= " AND e.location LIKE :location";
        $params[':location'] = '%' . $filters['location'] . '%';
    }

    $query .= " ORDER BY e.start_datetime ASC";
    
    $stmt = $this->conn->prepare($query);
    $stmt->execute($params);
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
}
?>