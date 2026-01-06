CREATE DATABASE volunteer_connect;
USE volunteer_connect;

-- Users table (renamed from users to USER)
CREATE TABLE USER (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('volunteer', 'organization', 'admin') DEFAULT 'volunteer',
    profile_bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EVENTS table
CREATE TABLE EVENT (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    volunteer_slots INT DEFAULT 1,
    status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES USER(user_id) ON DELETE SET NULL
);

-- VOLUNTEER_REGISTRATION table
CREATE TABLE VOLUNTEER_REGISTRATION (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    status ENUM('pending', 'confirmed', 'attended', 'cancelled') DEFAULT 'pending',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    event_id INT,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES EVENT(event_id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (user_id, event_id)
);
ALTER TABLE VOLUNTEER_REGISTRATION 
ADD COLUMN email_status ENUM('unverified', 'verified') DEFAULT 'unverified';

CREATE TABLE NOTIFICATIONS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                 -- the user who should receive this notification (event author)
    event_id INT NOT NULL,                -- the related event
    registration_id INT NOT NULL,         -- the registration that triggered the notification
    message VARCHAR(255) NOT NULL,        -- short notification text
    is_read TINYINT(1) DEFAULT 0,         -- mark as read/unread
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES EVENT(event_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_registration FOREIGN KEY (registration_id) REFERENCES VOLUNTEER_REGISTRATION(registration_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

DELIMITER $$

CREATE TRIGGER after_volunteer_registration
AFTER INSERT ON VOLUNTEER_REGISTRATION
FOR EACH ROW
BEGIN
    DECLARE author_id INT;

    -- Get the event creator
    SELECT created_by INTO author_id 
    FROM EVENT 
    WHERE event_id = NEW.event_id;

    -- Only insert notification if author exists
    IF author_id IS NOT NULL THEN
        INSERT INTO NOTIFICATIONS (user_id, event_id, registration_id, message)
        VALUES (
            author_id,
            NEW.event_id,
            NEW.registration_id,
            CONCAT('A volunteer has registered for your event (Registration ID: ', NEW.registration_id, ')')
        );
    END IF;
END$$

DELIMITER ;



-- BLOG table
CREATE TABLE BLOG (
    blog_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    author_id INT,
    FOREIGN KEY (author_id) REFERENCES USER(user_id) ON DELETE CASCADE
);




-- Insert sample data
INSERT INTO USER (username, password_hash, email, full_name, role, profile_bio) VALUES
('admin_user', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@volunteerconnect.org', 'Admin User', 'admin', 'System administrator for Volunteer Connect.');

INSERT INTO EVENT (title, description, location, start_datetime, end_datetime, volunteer_slots, created_by) VALUES
('Community Park Cleanup', 'Join us for a day of cleaning and beautifying our local community park. We will be picking up trash, planting flowers, and maintaining walking paths.', 'Central Community Park', '2024-02-15 09:00:00', '2024-02-15 13:00:00', 20, 2),
('Food Bank Sorting', 'Help sort and organize food donations at the local food bank. This is a great opportunity to make a direct impact on fighting hunger in our community.', 'Community Food Bank, 123 Main St', '2024-02-20 10:00:00', '2024-02-20 14:00:00', 15, 2),
('Virtual Tutoring Session', 'Provide online tutoring for underprivileged students in math and science subjects. Remote opportunity - help from anywhere!', 'Online - Remote', '2024-02-18 16:00:00', '2024-02-18 18:00:00', 10, 2);

INSERT INTO BLOG (title, content, author_id) VALUES
('The Power of Community Service', 'Community service has the incredible power to transform both the giver and the receiver. In this post, I want to share my personal journey...', 1),
('5 Benefits of Regular Volunteering', 'Regular volunteering not only helps your community but also provides numerous personal benefits. Here are the top 5 benefits I have experienced...', 2);

INSERT INTO BLOG (title, content, author_id) VALUES
('The Joy of Volunteering', 'Volunteering has changed my life in so many ways. Here are my experiences...', 2),
('Community Garden Success Story', 'How our community garden project helped bring neighbors together...', 3),
('5 Benefits of Regular Volunteering', 'Discover how volunteering can improve your mental health and social connections...', 2);


INSERT INTO VOLUNTEER_REGISTRATION (user_id, event_id, status) VALUES
(2, 1, 'confirmed'),
(2, 2, 'pending');

-- EMAIL_VERIFICATION table
CREATE TABLE EMAIL_VERIFICATION (
    verification_id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    email_token VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    verified_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (registration_id) REFERENCES VOLUNTEER_REGISTRATION(registration_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES EVENT(event_id) ON DELETE CASCADE,
    
    INDEX idx_token (email_token),
    INDEX idx_expires (expires_at)
);



-- Create a new table for detailed volunteer information
CREATE TABLE VOLUNTEER_DETAILS (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    emergency_contact TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    preferred_role VARCHAR(100) NOT NULL,
    time_slots TEXT,
    experience TEXT,
    skills TEXT,
    photo_release BOOLEAN DEFAULT FALSE,
    additional_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES VOLUNTEER_REGISTRATION(registration_id) ON DELETE CASCADE
);
