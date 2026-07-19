CREATE DATABASE IF NOT EXISTS web3d_portfolio;
USE web3d_portfolio;

CREATE TABLE roles (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    tagline VARCHAR(255) DEFAULT NULL,
    profile_image VARCHAR(500) DEFAULT NULL,
    document_id INT DEFAULT NULL,
    materials_url VARCHAR(500) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT NULL,
    is_logged_in BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    relative_path VARCHAR(500) NOT NULL,
    absolute_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100),
    file_size INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE social_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cvs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    document_id INT DEFAULT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    access_token_exp DATETIME NOT NULL,
    refresh_token_exp DATETIME NOT NULL,
    user_agent VARCHAR(500),
    ip_address VARCHAR(45),
    is_valid BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE academics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    university_name VARCHAR(255) NOT NULL,
    college_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    contents TEXT,
    github_link VARCHAR(500),
    url_of_company VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE academic_icons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    academic_id INT NOT NULL,
    icon_url VARCHAR(500) NOT NULL,
    document_id INT DEFAULT NULL,
    FOREIGN KEY (academic_id) REFERENCES academics(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE academics_contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    academic_id INT NOT NULL,
    content_text TEXT,
    image_url VARCHAR(500),
    image_description VARCHAR(500),
    document_id INT DEFAULT NULL,
    display_order INT DEFAULT 0,
    FOREIGN KEY (academic_id) REFERENCES academics(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE journey (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    office_name VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    description TEXT,
    contents TEXT,
    url_of_company VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE journey_icons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    journey_id INT NOT NULL,
    icon_url VARCHAR(500) NOT NULL,
    document_id INT DEFAULT NULL,
    FOREIGN KEY (journey_id) REFERENCES journey(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE journey_contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    journey_id INT NOT NULL,
    content_text TEXT,
    image_url VARCHAR(500),
    image_description VARCHAR(500),
    document_id INT DEFAULT NULL,
    display_order INT DEFAULT 0,
    FOREIGN KEY (journey_id) REFERENCES journey(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icons VARCHAR(500),
    document_id INT DEFAULT NULL,
    link BOOLEAN DEFAULT TRUE,
    contents TEXT,
    source_code_link VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE project_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE project_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    icons JSON,
    image_url VARCHAR(500),
    image_description VARCHAR(500),
    document_id INT DEFAULT NULL,
    contents TEXT,
    display_order INT DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icons VARCHAR(500),
    document_id INT DEFAULT NULL,
    link BOOLEAN DEFAULT TRUE,
    contents TEXT,
    source_code_link VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE achievement_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    achievement_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE achievement_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    achievement_id INT NOT NULL,
    icons JSON,
    image_url VARCHAR(500),
    image_description VARCHAR(500),
    document_id INT DEFAULT NULL,
    contents TEXT,
    display_order INT DEFAULT 0,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    testimonial TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    company VARCHAR(255),
    image VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE academic_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icons VARCHAR(500),
    document_id INT DEFAULT NULL,
    link BOOLEAN DEFAULT TRUE,
    contents TEXT,
    source_code_link VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE academic_project_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    academic_project_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (academic_project_id) REFERENCES academic_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE academic_project_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    academic_project_id INT NOT NULL,
    icons JSON,
    image_url VARCHAR(500),
    image_description VARCHAR(500),
    document_id INT DEFAULT NULL,
    contents TEXT,
    display_order INT DEFAULT 0,
    FOREIGN KEY (academic_project_id) REFERENCES academic_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE photography (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE photography_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    photography_id INT NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    caption VARCHAR(500),
    display_order INT DEFAULT 0,
    document_id INT DEFAULT NULL,
    FOREIGN KEY (photography_id) REFERENCES photography(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE photography_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    photography_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (photography_id) REFERENCES photography(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (id, name) VALUES (1, 'admin'), (2, 'user') ON DUPLICATE KEY UPDATE name=VALUES(name);

CREATE TABLE chat_sessions (
    id VARCHAR(64) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_created (session_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE knowledge_chunks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_table VARCHAR(50) NOT NULL,
    source_id INT NOT NULL,
    chunk_text TEXT NOT NULL,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FULLTEXT KEY ft_chunk (chunk_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
