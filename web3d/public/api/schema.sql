CREATE DATABASE IF NOT EXISTS web3d_portfolio;
USE web3d_portfolio;

CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    tagline VARCHAR(255) DEFAULT NULL,
    profile_image VARCHAR(500) DEFAULT NULL,
    document_id VARCHAR(36) DEFAULT NULL,
    materials_url VARCHAR(500) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT NULL,
    is_logged_in BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE documents (
    id VARCHAR(36) PRIMARY KEY,
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
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
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

-- ==================== MAIN ENTITY TABLES ====================

CREATE TABLE journey (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    office_name VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    description TEXT,
    contents TEXT,
    url_of_company VARCHAR(500),
    background_document_id VARCHAR(36) DEFAULT NULL,
    document_id VARCHAR(36) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (background_document_id) REFERENCES documents(id) ON DELETE SET NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE academics (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    university_name VARCHAR(255) DEFAULT NULL,
    college_name VARCHAR(255) DEFAULT NULL,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    description TEXT,
    github_link VARCHAR(500),
    url_of_company VARCHAR(500),
    icon_document_id VARCHAR(36) DEFAULT NULL,
    background_document_id VARCHAR(36) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (icon_document_id) REFERENCES documents(id) ON DELETE SET NULL,
    FOREIGN KEY (background_document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category ENUM('workproject', 'academicsproject') NOT NULL DEFAULT 'workproject',
    description TEXT,
    detail TEXT,
    icons VARCHAR(500),
    document_id VARCHAR(36) DEFAULT NULL,
    link BOOLEAN DEFAULT TRUE,
    contents TEXT,
    source_code_link VARCHAR(500),
    background_document_id VARCHAR(36) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
    FOREIGN KEY (background_document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE achievements (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icons VARCHAR(500),
    icon_document_id VARCHAR(36) DEFAULT NULL,
    background_document_id VARCHAR(36) DEFAULT NULL,
    link BOOLEAN DEFAULT TRUE,
    contents TEXT,
    source_code_link VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (icon_document_id) REFERENCES documents(id) ON DELETE SET NULL,
    FOREIGN KEY (background_document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== NORMALIZED CHILD TABLES ====================

CREATE TABLE entity_contents (
    id VARCHAR(36) PRIMARY KEY,
    entity_type ENUM('academic', 'journey', 'project', 'achievement') NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    heading VARCHAR(255) DEFAULT '',
    content_text TEXT,
    display_order INT DEFAULT 0,
    INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE entity_content_details (
    id VARCHAR(36) PRIMARY KEY,
    entity_content_id VARCHAR(36) NOT NULL,
    image_id VARCHAR(36) DEFAULT NULL,
    title VARCHAR(255) DEFAULT '',
    embedded_url TEXT DEFAULT NULL,
    display_order INT DEFAULT 0,
    FOREIGN KEY (entity_content_id) REFERENCES entity_contents(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES documents(id) ON DELETE SET NULL,
    INDEX idx_entity_content (entity_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE entity_links (
    id VARCHAR(36) PRIMARY KEY,
    entity_type ENUM('journey', 'project', 'academic_project', 'achievement') NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    label VARCHAR(100) NOT NULL DEFAULT '',
    url VARCHAR(500) NOT NULL DEFAULT '',
    display_order INT DEFAULT 0,
    INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE entity_promotions (
    id VARCHAR(36) PRIMARY KEY,
    journey_id VARCHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    year DATE DEFAULT NULL,
    position VARCHAR(255) NOT NULL DEFAULT '',
    description TEXT,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journey(id) ON DELETE CASCADE,
    INDEX idx_journey (journey_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE entity_promotion_contents (
    id VARCHAR(36) PRIMARY KEY,
    promotion_id VARCHAR(36) NOT NULL,
    heading VARCHAR(255) DEFAULT '',
    content_text TEXT,
    display_order INT DEFAULT 0,
    FOREIGN KEY (promotion_id) REFERENCES entity_promotions(id) ON DELETE CASCADE,
    INDEX idx_promotion (promotion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE entity_promotion_content_details (
    id VARCHAR(36) PRIMARY KEY,
    promotion_content_id VARCHAR(36) NOT NULL,
    image_id VARCHAR(36) DEFAULT NULL,
    title VARCHAR(255) DEFAULT '',
    display_order INT DEFAULT 0,
    FOREIGN KEY (promotion_content_id) REFERENCES entity_promotion_contents(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES documents(id) ON DELETE SET NULL,
    INDEX idx_promo_content (promotion_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE entity_tags (
    id VARCHAR(36) PRIMARY KEY,
    entity_type ENUM('project', 'achievement', 'academic_project', 'photography') NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE entity_details (
    id VARCHAR(36) PRIMARY KEY,
    entity_type ENUM('project', 'achievement') NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    heading VARCHAR(255) DEFAULT '',
    icon_id VARCHAR(36) DEFAULT NULL,
    document_id VARCHAR(36) DEFAULT NULL,
    contents TEXT,
    display_order INT DEFAULT 0,
    FOREIGN KEY (icon_id) REFERENCES documents(id) ON DELETE SET NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
    INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== OTHER TABLES ====================

CREATE TABLE testimonials (
    id VARCHAR(36) PRIMARY KEY,
    testimonial TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    company VARCHAR(255),
    image VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE photography (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE photography_photos (
    id VARCHAR(36) PRIMARY KEY,
    photography_id VARCHAR(36) NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    caption VARCHAR(500),
    display_order INT DEFAULT 0,
    document_id VARCHAR(36) DEFAULT NULL,
    FOREIGN KEY (photography_id) REFERENCES photography(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (id, name) VALUES ('1', 'admin'), ('2', 'user') ON DUPLICATE KEY UPDATE name=VALUES(name);

CREATE TABLE chat_sessions (
    id VARCHAR(64) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_created (session_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE knowledge_chunks (
    id VARCHAR(36) PRIMARY KEY,
    source_table VARCHAR(50) NOT NULL,
    source_id VARCHAR(36) NOT NULL,
    chunk_text TEXT NOT NULL,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FULLTEXT KEY ft_chunk (chunk_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== MIGRATIONS ====================
-- If upgrading from old schema, run these ALTER statements:
--
-- ALTER TABLE projects ADD COLUMN detail TEXT AFTER description;
-- ALTER TABLE entity_contents MODIFY COLUMN entity_type ENUM('academic', 'journey', 'project') NOT NULL;
-- ALTER TABLE entity_contents DROP COLUMN image_url, DROP COLUMN image_description, DROP COLUMN document_id;
