<?php
require_once __DIR__ . '/../helpers/uuid.php';

/**
 * Auto-migration: normalizes schema, drops redundant tables, creates entity_contents/entity_tags/entity_details.
 * Safe to run repeatedly.
 */
function runMigrations($db) {
    migrateNormalize($db);
}

function migrateNormalize($db) {
    $db->exec('SET FOREIGN_KEY_CHECKS = 0');
    $db->exec('SET UNIQUE_CHECKS = 0');

    try {
        // Step 1: Ensure new columns exist on main entity tables
        addColumnSafe($db, 'academics', 'document_id', "VARCHAR(36) DEFAULT NULL AFTER background_document_id");
        renameColumnSafe($db, 'academics', 'document_id', 'icon_document_id');
        dropColumnSafe($db, 'academics', 'document_id');
        addColumnSafe($db, 'journey', 'document_id', "VARCHAR(36) DEFAULT NULL AFTER background_document_id");
        addColumnSafe($db, 'projects', 'academic_id', "VARCHAR(36) DEFAULT NULL AFTER source_code_link");

        // Step 1b: Drop background_image columns (use background_document_id + document join instead)
        dropColumnSafe($db, 'academics', 'background_image');
        dropColumnSafe($db, 'journey', 'background_image');

        // Step 1c: Drop old FK constraint on academics.document_id if it exists
        dropConstraintSafe($db, 'academics', 'fk_academics_document');

        // Step 2: Create normalized tables if they don't exist
        createEntityContentsTable($db);
        createEntityTagsTable($db);
        createEntityDetailsTable($db);

        // Step 2b: Add image_ids column to entity_contents and entity_details for multi-image support
        addColumnSafe($db, 'entity_contents', 'image_ids', "TEXT DEFAULT NULL AFTER document_id");
        addColumnSafe($db, 'entity_details', 'image_ids', "TEXT DEFAULT NULL AFTER document_id");

        // Step 3: Migrate data from old tables to new normalized tables
        migrateContentsData($db);
        migrateTagsData($db);
        migrateDetailsData($db);

        // Step 4: Drop old redundant tables
        $tablesToDrop = [
            'academic_icons', 'journey_icons',
            'academics_contents', 'journey_contents',
            'project_tags', 'achievement_tags', 'academic_project_tags', 'photography_tags',
            'project_details', 'achievement_details', 'academic_project_details',
            'academic_projects', 'cvs'
        ];

        foreach ($tablesToDrop as $table) {
            dropTableSafe($db, $table);
        }

        // Step 4b: Ensure site_settings has bg_image_id column
        addColumnSafe($db, 'site_settings', 'bg_image_id', "VARCHAR(36) DEFAULT NULL");
        migrateAboutBgImageToDocument($db);

        // Step 5: Recreate FK constraints for remaining tables
        recreateForeignKeys($db);

        $db->exec('SET UNIQUE_CHECKS = 1');
        $db->exec('SET FOREIGN_KEY_CHECKS = 1');

        error_log("Schema normalization: Completed successfully!");
    } catch (Exception $e) {
        $db->exec('SET UNIQUE_CHECKS = 1');
        $db->exec('SET FOREIGN_KEY_CHECKS = 1');
        error_log("Schema normalization FAILED: " . $e->getMessage());
        throw $e;
    }
}

function addColumnSafe($db, $table, $column, $definition) {
    try {
        $db->exec("ALTER TABLE {$table} ADD COLUMN {$column} {$definition}");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') === false) {
            throw $e;
        }
    }
}

function dropColumnSafe($db, $table, $column) {
    try {
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
        );
        $stmt->execute([$table, $column]);
        if ($stmt->fetchColumn() > 0) {
            $db->exec("ALTER TABLE {$table} DROP COLUMN {$column}");
            error_log("Dropped column: {$table}.{$column}");
        }
    } catch (PDOException $e) {
        error_log("Failed to drop column {$table}.{$column}: " . $e->getMessage());
    }
}

function renameColumnSafe($db, $table, $oldColumn, $newColumn) {
    try {
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
        );
        $stmt->execute([$table, $oldColumn]);
        if ($stmt->fetchColumn() > 0) {
            $db->exec("ALTER TABLE {$table} RENAME COLUMN {$oldColumn} TO {$newColumn}");
            error_log("Renamed column: {$table}.{$oldColumn} -> {$newColumn}");
        }
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') === false && strpos($e->getMessage(), 'Unknown column') === false) {
            error_log("Failed to rename column {$table}.{$oldColumn}: " . $e->getMessage());
        }
    }
}

function dropConstraintSafe($db, $table, $constraintName) {
    try {
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'"
        );
        $stmt->execute([$table, $constraintName]);
        if ($stmt->fetchColumn() > 0) {
            $db->exec("ALTER TABLE {$table} DROP FOREIGN KEY {$constraintName}");
            error_log("Dropped FK constraint: {$table}.{$constraintName}");
        }
    } catch (PDOException $e) {
        error_log("Failed to drop constraint {$table}.{$constraintName}: " . $e->getMessage());
    }
}

function dropTableSafe($db, $table) {
    try {
        $db->exec("DROP TABLE IF EXISTS {$table}");
        error_log("Dropped table: {$table}");
    } catch (PDOException $e) {
        error_log("Failed to drop {$table}: " . $e->getMessage());
    }
}

function createEntityContentsTable($db) {
    $db->exec("CREATE TABLE IF NOT EXISTS entity_contents (
        id VARCHAR(36) PRIMARY KEY,
        entity_type ENUM('academic', 'journey') NOT NULL,
        entity_id VARCHAR(36) NOT NULL,
        heading VARCHAR(255) DEFAULT '',
        content_text TEXT,
        image_url TEXT,
        image_description VARCHAR(500),
        document_id VARCHAR(36) DEFAULT NULL,
        image_ids TEXT DEFAULT NULL,
        display_order INT DEFAULT 0,
        INDEX idx_entity (entity_type, entity_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function createEntityTagsTable($db) {
    $db->exec("CREATE TABLE IF NOT EXISTS entity_tags (
        id VARCHAR(36) PRIMARY KEY,
        entity_type ENUM('project', 'achievement', 'academic_project', 'photography') NOT NULL,
        entity_id VARCHAR(36) NOT NULL,
        tag VARCHAR(100) NOT NULL,
        INDEX idx_entity (entity_type, entity_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function createEntityDetailsTable($db) {
    $db->exec("CREATE TABLE IF NOT EXISTS entity_details (
        id VARCHAR(36) PRIMARY KEY,
        entity_type ENUM('project', 'achievement') NOT NULL,
        entity_id VARCHAR(36) NOT NULL,
        heading VARCHAR(255) DEFAULT '',
        icons JSON,
        image_url TEXT,
        image_description VARCHAR(500),
        document_id VARCHAR(36) DEFAULT NULL,
        contents TEXT,
        display_order INT DEFAULT 0,
        INDEX idx_entity (entity_type, entity_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function migrateContentsData($db) {
    // Migrate academics_contents → entity_contents (type='academic')
    if (tableExists($db, 'academics_contents')) {
        try {
            $stmt = $db->query("SELECT id, academic_id, heading, content_text, image_url, image_description, document_id, display_order FROM academics_contents");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $insert = $db->prepare("INSERT IGNORE INTO entity_contents (id, entity_type, entity_id, heading, content_text, image_url, image_description, document_id, display_order) VALUES (?, 'academic', ?, ?, ?, ?, ?, ?, ?)");
            foreach ($rows as $row) {
                $insert->execute([
                    $row['id'], $row['academic_id'], $row['heading'] ?? '',
                    $row['content_text'], $row['image_url'], $row['image_description'],
                    $row['document_id'], $row['display_order'] ?? 0
                ]);
            }
            error_log("Migrated " . count($rows) . " rows from academics_contents → entity_contents");
        } catch (PDOException $e) {
            error_log("Failed to migrate academics_contents: " . $e->getMessage());
        }
    }

    // Migrate journey_contents → entity_contents (type='journey')
    if (tableExists($db, 'journey_contents')) {
        try {
            $stmt = $db->query("SELECT id, journey_id, heading, content_text, image_url, image_description, document_id, display_order FROM journey_contents");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $insert = $db->prepare("INSERT IGNORE INTO entity_contents (id, entity_type, entity_id, heading, content_text, image_url, image_description, document_id, display_order) VALUES (?, 'journey', ?, ?, ?, ?, ?, ?, ?)");
            foreach ($rows as $row) {
                $insert->execute([
                    $row['id'], $row['journey_id'], $row['heading'] ?? '',
                    $row['content_text'], $row['image_url'], $row['image_description'],
                    $row['document_id'], $row['display_order'] ?? 0
                ]);
            }
            error_log("Migrated " . count($rows) . " rows from journey_contents → entity_contents");
        } catch (PDOException $e) {
            error_log("Failed to migrate journey_contents: " . $e->getMessage());
        }
    }
}

function migrateTagsData($db) {
    // Migrate project_tags → entity_tags (type='project')
    if (tableExists($db, 'project_tags')) {
        try {
            $stmt = $db->query("SELECT id, project_id, tag FROM project_tags");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $insert = $db->prepare("INSERT IGNORE INTO entity_tags (id, entity_type, entity_id, tag) VALUES (?, 'project', ?, ?)");
            foreach ($rows as $row) {
                $insert->execute([$row['id'], $row['project_id'], $row['tag']]);
            }
            error_log("Migrated " . count($rows) . " rows from project_tags → entity_tags");
        } catch (PDOException $e) {
            error_log("Failed to migrate project_tags: " . $e->getMessage());
        }
    }

    // Migrate achievement_tags → entity_tags (type='achievement')
    if (tableExists($db, 'achievement_tags')) {
        try {
            $stmt = $db->query("SELECT id, achievement_id, tag FROM achievement_tags");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $insert = $db->prepare("INSERT IGNORE INTO entity_tags (id, entity_type, entity_id, tag) VALUES (?, 'achievement', ?, ?)");
            foreach ($rows as $row) {
                $insert->execute([$row['id'], $row['achievement_id'], $row['tag']]);
            }
            error_log("Migrated " . count($rows) . " rows from achievement_tags → entity_tags");
        } catch (PDOException $e) {
            error_log("Failed to migrate achievement_tags: " . $e->getMessage());
        }
    }

    // Migrate academic_project_tags → entity_tags (type='academic_project')
    if (tableExists($db, 'academic_project_tags')) {
        try {
            $stmt = $db->query("SELECT id, academic_project_id, tag FROM academic_project_tags");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $insert = $db->prepare("INSERT IGNORE INTO entity_tags (id, entity_type, entity_id, tag) VALUES (?, 'academic_project', ?, ?)");
            foreach ($rows as $row) {
                $insert->execute([$row['id'], $row['academic_project_id'], $row['tag']]);
            }
            error_log("Migrated " . count($rows) . " rows from academic_project_tags → entity_tags");
        } catch (PDOException $e) {
            error_log("Failed to migrate academic_project_tags: " . $e->getMessage());
        }
    }

    // Migrate photography_tags → entity_tags (type='photography')
    if (tableExists($db, 'photography_tags')) {
        try {
            $stmt = $db->query("SELECT id, photography_id, tag FROM photography_tags");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $insert = $db->prepare("INSERT IGNORE INTO entity_tags (id, entity_type, entity_id, tag) VALUES (?, 'photography', ?, ?)");
            foreach ($rows as $row) {
                $insert->execute([$row['id'], $row['photography_id'], $row['tag']]);
            }
            error_log("Migrated " . count($rows) . " rows from photography_tags → entity_tags");
        } catch (PDOException $e) {
            error_log("Failed to migrate photography_tags: " . $e->getMessage());
        }
    }
}

function migrateDetailsData($db) {
    // Migrate project_details → entity_details (type='project')
    if (tableExists($db, 'project_details')) {
        try {
            $stmt = $db->query("SELECT id, project_id, heading, icons, image_url, image_description, document_id, contents, display_order FROM project_details");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $insert = $db->prepare("INSERT IGNORE INTO entity_details (id, entity_type, entity_id, heading, icons, image_url, image_description, document_id, contents, display_order) VALUES (?, 'project', ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($rows as $row) {
                $icons = is_array($row['icons']) ? json_encode($row['icons']) : $row['icons'];
                $insert->execute([
                    $row['id'], $row['project_id'], $row['heading'] ?? '',
                    $icons, $row['image_url'], $row['image_description'],
                    $row['document_id'], $row['contents'], $row['display_order'] ?? 0
                ]);
            }
            error_log("Migrated " . count($rows) . " rows from project_details → entity_details");
        } catch (PDOException $e) {
            error_log("Failed to migrate project_details: " . $e->getMessage());
        }
    }

    // Migrate achievement_details → entity_details (type='achievement')
    if (tableExists($db, 'achievement_details')) {
        try {
            $stmt = $db->query("SELECT id, achievement_id, heading, icons, image_url, image_description, document_id, contents, display_order FROM achievement_details");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $insert = $db->prepare("INSERT IGNORE INTO entity_details (id, entity_type, entity_id, heading, icons, image_url, image_description, document_id, contents, display_order) VALUES (?, 'achievement', ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($rows as $row) {
                $icons = is_array($row['icons']) ? json_encode($row['icons']) : $row['icons'];
                $insert->execute([
                    $row['id'], $row['achievement_id'], $row['heading'] ?? '',
                    $icons, $row['image_url'], $row['image_description'],
                    $row['document_id'], $row['contents'], $row['display_order'] ?? 0
                ]);
            }
            error_log("Migrated " . count($rows) . " rows from achievement_details → entity_details");
        } catch (PDOException $e) {
            error_log("Failed to migrate achievement_details: " . $e->getMessage());
        }
    }

    // Migrate academic_project_details → entity_details (type='project', map academic_project_id → project_id)
    if (tableExists($db, 'academic_project_details')) {
        try {
            $stmt = $db->query("SELECT id, academic_project_id, heading, icons, image_url, image_description, document_id, contents, display_order FROM academic_project_details");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $insert = $db->prepare("INSERT IGNORE INTO entity_details (id, entity_type, entity_id, heading, icons, image_url, image_description, document_id, contents, display_order) VALUES (?, 'project', ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($rows as $row) {
                $icons = is_array($row['icons']) ? json_encode($row['icons']) : $row['icons'];
                $insert->execute([
                    $row['id'], $row['academic_project_id'], $row['heading'] ?? '',
                    $icons, $row['image_url'], $row['image_description'],
                    $row['document_id'], $row['contents'], $row['display_order'] ?? 0
                ]);
            }
            error_log("Migrated " . count($rows) . " rows from academic_project_details → entity_details");
        } catch (PDOException $e) {
            error_log("Failed to migrate academic_project_details: " . $e->getMessage());
        }
    }
}

function tableExists($db, $table) {
    try {
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?"
        );
        $stmt->execute([$table]);
        return $stmt->fetchColumn() > 0;
    } catch (PDOException $e) {
        return false;
    }
}

function migrateAboutBgImageToDocument($db) {
    if (!tableExists($db, 'site_settings')) {
        return;
    }

    try {
        $stmt = $db->prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'about_bg_image' AND bg_image_id IS NULL");
        $stmt->execute();
        $row = $stmt->fetch();

        if ($row && !empty($row['setting_value'])) {
            $url = $row['setting_value'];
            $fileName = basename($url);
            $docId = generateUUID();

            $docStmt = $db->prepare(
                "INSERT IGNORE INTO documents (id, user_id, file_name, original_name, relative_path, absolute_path, file_type, mime_type, file_size, created_at, updated_at)
                 VALUES (?, 'system', ?, ?, ?, ?, 'site_image', 'image/jpeg', 0, NOW(), NOW())"
            );
            $docStmt->execute([$docId, $fileName, $fileName, $url, $url]);

            $updateStmt = $db->prepare("UPDATE site_settings SET bg_image_id = ? WHERE setting_key = 'about_bg_image'");
            $updateStmt->execute([$docId]);

            error_log("Migrated about_bg_image to document: " . $docId);
        }
    } catch (PDOException $e) {
        error_log("Failed to migrate about_bg_image: " . $e->getMessage());
    }
}

function recreateForeignKeys($db) {
    $fks = [
        "ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)",
        "ALTER TABLE users ADD CONSTRAINT fk_users_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE documents ADD CONSTRAINT fk_documents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
        "ALTER TABLE social_links ADD CONSTRAINT fk_sl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
        "ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
        "ALTER TABLE academics ADD CONSTRAINT fk_academics_bg_document FOREIGN KEY (background_document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE academics ADD CONSTRAINT fk_academics_icon_document FOREIGN KEY (icon_document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE journey ADD CONSTRAINT fk_journey_bg_document FOREIGN KEY (background_document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE journey ADD CONSTRAINT fk_journey_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE projects ADD CONSTRAINT fk_projects_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE projects ADD CONSTRAINT fk_projects_academic FOREIGN KEY (academic_id) REFERENCES academics(id) ON DELETE SET NULL",
        "ALTER TABLE achievements ADD CONSTRAINT fk_achievements_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE entity_contents ADD CONSTRAINT fk_ec_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE entity_details ADD CONSTRAINT fk_ed_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE chat_messages ADD CONSTRAINT fk_cm_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE",
        "ALTER TABLE site_settings ADD CONSTRAINT fk_ss_bg_image FOREIGN KEY (bg_image_id) REFERENCES documents(id) ON DELETE SET NULL",
    ];

    foreach ($fks as $sql) {
        try {
            $db->exec($sql);
        } catch (PDOException $e) {
            $msg = $e->getMessage();
            if (strpos($msg, 'Duplicate') !== false || strpos($msg, 'already exists') !== false) {
                continue;
            }
            error_log("FK recreate error: " . $msg . " | SQL: " . $sql);
        }
    }

    if (tableExists($db, 'photography_photos')) {
        $photoFks = [
            "ALTER TABLE photography_photos ADD CONSTRAINT fk_pp_photography FOREIGN KEY (photography_id) REFERENCES photography(id) ON DELETE CASCADE",
            "ALTER TABLE photography_photos ADD CONSTRAINT fk_pp_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL",
        ];
        foreach ($photoFks as $sql) {
            try {
                $db->exec($sql);
            } catch (PDOException $e) {
                $msg = $e->getMessage();
                if (strpos($msg, 'Duplicate') !== false || strpos($msg, 'already exists') !== false) {
                    continue;
                }
                error_log("FK recreate error: " . $msg . " | SQL: " . $sql);
            }
        }
    }
}
