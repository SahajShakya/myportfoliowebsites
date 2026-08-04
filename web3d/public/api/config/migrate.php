<?php
require_once __DIR__ . '/../helpers/uuid.php';

/**
 * Auto-migration: normalizes schema, drops redundant tables, creates entity_contents/entity_tags/entity_details.
 * Safe to run repeatedly.
 */
function runMigrations($db) {
    migrateNormalize($db);
    migrateCleanImageUrls($db);
    migrateDropEntityContentRedundantColumns($db);
    migrateDropEntityDetailRedundantColumns($db);
    migrateToContentDetails($db);
    migrateToEntityLinks($db);
    migrateToEntityPromotions($db);
    migrateAddPromotionDates($db);
    addColumnSafe($db, 'entity_promotion_content_details', 'embedded_url', "TEXT DEFAULT NULL AFTER title");
    migrateTestimonialImages($db);
    migrateDropEntityContentUnusedColumns($db);
    addColumnSafe($db, 'entity_promotions', 'description', "TEXT DEFAULT NULL AFTER position");
    dropColumnSafe($db, 'entity_promotions', 'designation');
    addColumnSafe($db, 'projects', 'detail', "TEXT DEFAULT NULL AFTER description");
    migrateAchievementsToNormalized($db);
    migrateRevertAcademicsMerge($db);
    createPhotographyTables($db);
    addColumnSafe($db, 'chat_messages', 'status', "VARCHAR(20) DEFAULT 'complete' AFTER content");
    migrateKnowledgeChunkSourceId($db);
    migrateChatMessageSeq($db);
}

/**
 * chat_messages.created_at only has second precision, so back-to-back messages
 * within the same second can tie. Add an auto-increment seq column so the poll
 * logic can order messages reliably.
 */
function migrateChatMessageSeq($db) {
    try {
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'seq'"
        );
        $stmt->execute();
        if ($stmt->fetchColumn() > 0) {
            return;
        }
        $db->exec(
            "ALTER TABLE chat_messages
             ADD COLUMN seq INT NOT NULL AUTO_INCREMENT,
             ADD UNIQUE KEY uq_chat_messages_seq (seq)"
        );
        error_log("migrateChatMessageSeq: added seq column");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            return;
        }
        error_log("migrateChatMessageSeq failed: " . $e->getMessage());
    }
}

/**
 * knowledge_chunks.source_id must hold UUIDs from the entity tables, but it was
 * created as an INT. Widen it to VARCHAR(36) so knowledge builds can insert.
 */
function migrateKnowledgeChunkSourceId($db) {
    try {
        $stmt = $db->prepare(
            "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'knowledge_chunks' AND COLUMN_NAME = 'source_id'"
        );
        $stmt->execute();
        $type = $stmt->fetchColumn();
        if ($type !== null && strpos($type, 'int') !== false) {
            $db->exec("ALTER TABLE knowledge_chunks MODIFY COLUMN source_id VARCHAR(36) NOT NULL");
            error_log("migrateKnowledgeChunkSourceId: source_id widened to VARCHAR(36)");
        }
    } catch (PDOException $e) {
        error_log("migrateKnowledgeChunkSourceId failed: " . $e->getMessage());
    }
}

/**
 * Creates the photography and photography_photos tables (one-to-many: one
 * photography post has many photos, each photo links to its document record
 * via photography_photos.document_id → documents.id).
 */
function createPhotographyTables($db) {
    if (!tableExists($db, 'documents')) {
        return;
    }

    try {
        $db->exec("CREATE TABLE IF NOT EXISTS photography (
            id VARCHAR(36) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    } catch (PDOException $e) {
        error_log("createPhotographyTables: photography table failed: " . $e->getMessage());
    }

    try {
        $db->exec("CREATE TABLE IF NOT EXISTS photography_photos (
            id VARCHAR(36) PRIMARY KEY,
            photography_id VARCHAR(36) NOT NULL,
            photo_url VARCHAR(500) NOT NULL,
            caption VARCHAR(500),
            display_order INT DEFAULT 0,
            document_id VARCHAR(36) DEFAULT NULL,
            INDEX idx_pp_photography (photography_id),
            CONSTRAINT fk_pp_photography FOREIGN KEY (photography_id) REFERENCES photography(id) ON DELETE CASCADE,
            CONSTRAINT fk_pp_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    } catch (PDOException $e) {
        error_log("createPhotographyTables: photography_photos table failed: " . $e->getMessage());
    }
}

function migrateTestimonialImages($db) {
    addColumnSafe($db, 'testimonials', 'image_id', "VARCHAR(36) DEFAULT NULL AFTER company");

    try {
        $db->exec("ALTER TABLE testimonials ADD CONSTRAINT fk_testimonial_image FOREIGN KEY (image_id) REFERENCES documents(id) ON DELETE SET NULL");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
            error_log("FK add error fk_testimonial_image: " . $e->getMessage());
        }
    }

    try {
        if (columnExists($db, 'testimonials', 'image')) {
            $rows = $db->query("SELECT id, image FROM testimonials WHERE image IS NOT NULL AND image != ''")->fetchAll(PDO::FETCH_ASSOC);
            $insertStmt = $db->prepare(
                "INSERT INTO documents (id, user_id, file_name, original_name, relative_path, absolute_path, file_type, mime_type, file_size)
                 VALUES (?, 'system', ?, ?, ?, ?, 'upload', '', 0)"
            );
            $updateStmt = $db->prepare("UPDATE testimonials SET image_id = ? WHERE id = ?");
            foreach ($rows as $row) {
                $relPath = $row['image'];
                if (strpos($relPath, '/uploads/') !== 0) {
                    $pos = strrpos($relPath, '/uploads/');
                    $relPath = $pos !== false ? substr($relPath, $pos) : '/uploads/' . ltrim($relPath, '/');
                }
                $docId = generateUUID();
                $fileName = basename($relPath);
                $absolutePath = dirname(__DIR__, 2) . $relPath;
                $insertStmt->execute([$docId, $fileName, $fileName, $relPath, $absolutePath]);
                $updateStmt->execute([$docId, $row['id']]);
            }
            dropColumnSafe($db, 'testimonials', 'image');
        }
    } catch (PDOException $e) {
        error_log("migrateTestimonialImages: legacy migration failed: " . $e->getMessage());
    }
}

function migrateAchievementsToNormalized($db) {
    // 1. Extend entity_contents enum to include 'achievement'
    try {
        $db->exec("ALTER TABLE entity_contents MODIFY COLUMN entity_type ENUM('academic', 'journey', 'project', 'achievement') NOT NULL");
    } catch (PDOException $e) {
        error_log("migrateAchievementsToNormalized: enum extend failed: " . $e->getMessage());
    }

    // 2. Ensure achievements.background_document_id exists
    addColumnSafe($db, 'achievements', 'background_document_id', "VARCHAR(36) DEFAULT NULL");

    // 3. Rename document_id -> icon_document_id (document now holds the achievement icon)
    dropConstraintSafe($db, 'achievements', 'fk_achievements_document');
    renameColumnSafe($db, 'achievements', 'document_id', 'icon_document_id');

    // 4. Re-add foreign keys for achievements
    try {
        $db->exec("ALTER TABLE achievements ADD CONSTRAINT fk_achievements_icon_document FOREIGN KEY (icon_document_id) REFERENCES documents(id) ON DELETE SET NULL");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
            error_log("FK add error fk_achievements_icon_document: " . $e->getMessage());
        }
    }
    try {
        $db->exec("ALTER TABLE achievements ADD CONSTRAINT fk_achievements_bg_document FOREIGN KEY (background_document_id) REFERENCES documents(id) ON DELETE SET NULL");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
            error_log("FK add error fk_achievements_bg_document: " . $e->getMessage());
        }
    }

    // 5. Migrate legacy achievement entity_details -> entity_contents/entity_content_details
    if (!tableExists($db, 'entity_details') || !tableExists($db, 'entity_contents')) {
        return;
    }

    try {
        $stmt = $db->prepare("SELECT COUNT(*) FROM entity_contents WHERE entity_type = 'achievement'");
        $stmt->execute();
        if ($stmt->fetchColumn() > 0) {
            error_log("migrateAchievementsToNormalized: Already migrated, skipping");
            return;
        }
    } catch (PDOException $e) {
        error_log("migrateAchievementsToNormalized: count check failed: " . $e->getMessage());
    }

    try {
        $stmt = $db->query("SELECT id, entity_id, heading, document_id, contents, display_order FROM entity_details WHERE entity_type = 'achievement'");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $insertContent = $db->prepare(
            "INSERT INTO entity_contents (id, entity_type, entity_id, heading, content_text, display_order) VALUES (?, 'achievement', ?, ?, ?, ?)"
        );
        $insertDetail = $db->prepare(
            "INSERT INTO entity_content_details (id, entity_content_id, image_id, title, embedded_url, display_order) VALUES (?, ?, ?, ?, ?, ?)"
        );
        $migrated = 0;
        foreach ($rows as $row) {
            $contentId = generateUUID();
            $insertContent->execute([
                $contentId,
                $row['entity_id'],
                $row['heading'] ?? '',
                $row['contents'] ?? '',
                $row['display_order'] ?? 0,
            ]);
            if (!empty($row['document_id'])) {
                $insertDetail->execute([
                    generateUUID(), $contentId, $row['document_id'], '', null, 0,
                ]);
            }
            $migrated++;
        }

        if ($migrated > 0) {
            $db->exec("DELETE FROM entity_details WHERE entity_type = 'achievement'");
        }

        error_log("migrateAchievementsToNormalized: Migrated " . $migrated . " achievement content sections");
    } catch (PDOException $e) {
        error_log("migrateAchievementsToNormalized: content migration failed: " . $e->getMessage());
    }
}

function createAcademicsTable($db) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS academics (
            id VARCHAR(36) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            university_name VARCHAR(255) DEFAULT NULL,
            college_name VARCHAR(255) DEFAULT NULL,
            start_date DATE DEFAULT NULL,
            end_date DATE DEFAULT NULL,
            description TEXT,
            github_link VARCHAR(500) DEFAULT NULL,
            url_of_company VARCHAR(500) DEFAULT NULL,
            icon_document_id VARCHAR(36) DEFAULT NULL,
            background_document_id VARCHAR(36) DEFAULT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    } catch (PDOException $e) {
        error_log("createAcademicsTable failed: " . $e->getMessage());
    }

    try {
        $db->exec("ALTER TABLE academics ADD CONSTRAINT fk_academics_icon_document FOREIGN KEY (icon_document_id) REFERENCES documents(id) ON DELETE SET NULL");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
            error_log("createAcademicsTable: icon FK failed: " . $e->getMessage());
        }
    }
    try {
        $db->exec("ALTER TABLE academics ADD CONSTRAINT fk_academics_bg_document FOREIGN KEY (background_document_id) REFERENCES documents(id) ON DELETE SET NULL");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
            error_log("createAcademicsTable: bg FK failed: " . $e->getMessage());
        }
    }
}

/**
 * Reverts the academics↔projects merge: moves any academic-category projects back
 * into the separate academics table and switches projects to a two-category enum
 * ('workproject', 'academicsproject'). Idempotent via a category-enum check.
 */
function migrateRevertAcademicsMerge($db) {
    if (!tableExists($db, 'projects')) {
        return;
    }

    // Already fully reverted once the enum is workproject/academicsproject
    $colType = getColumnType($db, 'projects', 'category');
    if ($colType !== null && strpos($colType, 'academicsproject') !== false && strpos($colType, 'professional') === false) {
        return;
    }

    createAcademicsTable($db);

    try {
        $rows = $db->query(
            "SELECT id, name, description, document_id, background_document_id, created_at
             FROM projects WHERE category = 'academic'"
        )->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("migrateRevertAcademicsMerge: select failed: " . $e->getMessage());
        $rows = [];
    }

    if (!empty($rows)) {
        $idList = implode(',', array_map(function ($id) {
            return "'" . str_replace("'", "''", $id) . "'";
        }, array_column($rows, 'id')));

        $insert = $db->prepare(
            "INSERT INTO academics (id, title, university_name, college_name, start_date, end_date, description, github_link, url_of_company, icon_document_id, background_document_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE id = id"
        );
        $getTags = $db->prepare("SELECT tag FROM entity_tags WHERE entity_type = 'project' AND entity_id = ?");
        $getLinks = $db->prepare("SELECT label, url FROM entity_links WHERE entity_type = 'project' AND entity_id = ?");

        foreach ($rows as $row) {
            $parsed = parseAcademicProjectDescription($row['description']);

            $tags = [];
            $getTags->execute([$row['id']]);
            foreach ($getTags->fetchAll(PDO::FETCH_COLUMN) as $tag) {
                $tags[] = $tag;
            }

            $urlOfCompany = null;
            $githubLink = null;
            $getLinks->execute([$row['id']]);
            foreach ($getLinks->fetchAll() as $link) {
                $label = strtolower($link['label']);
                if ($label === 'github') $githubLink = $link['url'];
                if ($label === 'website') $urlOfCompany = $link['url'];
            }

            $insert->execute([
                $row['id'],
                $row['name'],
                $parsed['university'] ?: ($tags[0] ?? null),
                $parsed['college'] ?: ($tags[1] ?? null),
                $parsed['start_date'],
                $parsed['end_date'],
                $parsed['description'],
                $githubLink,
                $urlOfCompany,
                $row['document_id'],
                $row['background_document_id'],
                $row['created_at'] ?? null,
            ]);
        }

        // Restore academic content sections to entity_type = 'academic'
        try {
            $db->exec("UPDATE entity_contents SET entity_type = 'academic' WHERE entity_type = 'project' AND entity_id IN ($idList)");
        } catch (PDOException $e) {
            error_log("migrateRevertAcademicsMerge: entity_contents revert failed: " . $e->getMessage());
        }

        // Remove the tags/links that the merge created for these entries
        try {
            $db->exec("DELETE FROM entity_tags WHERE entity_type = 'project' AND entity_id IN ($idList)");
            $db->exec("DELETE FROM entity_links WHERE entity_type = 'project' AND entity_id IN ($idList)");
        } catch (PDOException $e) {
            error_log("migrateRevertAcademicsMerge: tag/link cleanup failed: " . $e->getMessage());
        }

        // Remove academic entries from the projects table
        try {
            $db->exec("DELETE FROM projects WHERE category = 'academic'");
        } catch (PDOException $e) {
            error_log("migrateRevertAcademicsMerge: project delete failed: " . $e->getMessage());
        }

        error_log("migrateRevertAcademicsMerge: Reverted " . count($rows) . " academic entries to the academics table");
    }

    // Switch category to the two-category enum and backfill work projects
    // (enum is widened first so the UPDATE doesn't trip strict-mode data truncation)
    try {
        $db->exec("ALTER TABLE projects MODIFY COLUMN category ENUM('professional', 'academic', 'workproject', 'academicsproject') NOT NULL DEFAULT 'workproject'");
        $db->exec("UPDATE projects SET category = 'workproject' WHERE category = 'professional'");
        $db->exec("ALTER TABLE projects MODIFY COLUMN category ENUM('workproject', 'academicsproject') NOT NULL DEFAULT 'workproject'");
    } catch (PDOException $e) {
        error_log("migrateRevertAcademicsMerge: category enum switch failed: " . $e->getMessage());
    }

    // Drop the legacy academic_id column (from the old academic_projects feature)
    dropConstraintSafe($db, 'projects', 'fk_projects_academic');
    dropColumnSafe($db, 'projects', 'academic_id');
}

/**
 * Reverses buildAcademicProjectDescription: pulls University/College/Duration out of
 * the merged HTML description and returns the original description plus parsed dates.
 */
function parseAcademicProjectDescription($html) {
    $university = null;
    $college = null;
    $startYear = null;
    $endYear = null;

    if (preg_match('/<strong>University:<\/strong>\s*([^<]+)<\/p>/i', $html, $m)) {
        $university = trim(html_entity_decode($m[1]));
    }
    if (preg_match('/<strong>College:<\/strong>\s*([^<]+)<\/p>/i', $html, $m)) {
        $college = trim(html_entity_decode($m[1]));
    }
    if (preg_match('/<strong>Duration:<\/strong>\s*(\d{4})\s*-\s*(\d{4}|Present)/i', $html, $m)) {
        $startYear = $m[1];
        $endYear = $m[2] === 'Present' ? null : $m[2];
    }

    $description = preg_replace('/<p><strong>(University|College|Duration):<\/strong>.*?<\/p>/is', '', $html);

    return [
        'university' => $university,
        'college' => $college,
        'start_date' => $startYear ? $startYear . '-01-01' : null,
        'end_date' => $endYear ? $endYear . '-12-31' : null,
        'description' => $description,
    ];
}

function migrateNormalize($db) {
    $db->exec('SET FOREIGN_KEY_CHECKS = 0');
    $db->exec('SET UNIQUE_CHECKS = 0');

    try {
        // Step 1: Ensure new columns exist on main entity tables
        addColumnSafe($db, 'journey', 'document_id', "VARCHAR(36) DEFAULT NULL AFTER background_document_id");
        addColumnSafe($db, 'projects', 'background_document_id', "VARCHAR(36) DEFAULT NULL");

        // Step 1b: Drop background_image columns (use background_document_id + document join instead)
        dropColumnSafe($db, 'journey', 'background_image');

        // Step 2: Create normalized tables if they don't exist
        createEntityContentsTable($db);
        createEntityTagsTable($db);
        createEntityDetailsTable($db);

        // Step 2b: Add image_ids column to entity_contents and entity_details for multi-image support
        addColumnSafe($db, 'entity_contents', 'image_ids', "TEXT DEFAULT NULL AFTER content_text");
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
        migrateProfileImageToSiteSettings($db);
        migrateActiveCvToSiteSettings($db);

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
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
        );
        $stmt->execute([$table, $column]);
        if ($stmt->fetchColumn() > 0) {
            return;
        }
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

function columnExists($db, $table, $column) {
    try {
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
        );
        $stmt->execute([$table, $column]);
        return $stmt->fetchColumn() > 0;
    } catch (PDOException $e) {
        return false;
    }
}

function getColumnType($db, $table, $column) {
    try {
        $stmt = $db->prepare(
            "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
        );
        $stmt->execute([$table, $column]);
        return $stmt->fetchColumn();
    } catch (PDOException $e) {
        return null;
    }
}

function createEntityContentsTable($db) {
    $db->exec("CREATE TABLE IF NOT EXISTS entity_contents (
        id VARCHAR(36) PRIMARY KEY,
        entity_type ENUM('academic', 'journey') NOT NULL,
        entity_id VARCHAR(36) NOT NULL,
        heading VARCHAR(255) DEFAULT '',
        content_text TEXT,
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

function migrateProfileImageToSiteSettings($db) {
    if (!tableExists($db, 'site_settings')) {
        return;
    }

    try {
        $stmt = $db->prepare("SELECT document_id, profile_image FROM users WHERE document_id IS NOT NULL AND id NOT IN (SELECT user_id FROM site_settings WHERE setting_key = 'profile_image' AND bg_image_id IS NOT NULL)");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as $row) {
            $stmt2 = $db->prepare("INSERT IGNORE INTO site_settings (setting_key, bg_image_id) VALUES ('profile_image', ?)");
            $stmt2->execute([$row['document_id']]);
            error_log("Migrated profile_image to site_settings for user: " . $row['document_id']);
        }
    } catch (PDOException $e) {
        error_log("Failed to migrate profile_image: " . $e->getMessage());
    }
}

function migrateActiveCvToSiteSettings($db) {
    if (!tableExists($db, 'site_settings')) {
        return;
    }

    try {
        $stmt = $db->prepare("SELECT id FROM documents WHERE file_type = 'cv' AND file_name LIKE '%active%' LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch();

        if ($row) {
            $existing = $db->prepare("SELECT bg_image_id FROM site_settings WHERE setting_key = 'active_cv'");
            $existing->execute();
            $existingRow = $existing->fetch();

            if (!$existingRow || empty($existingRow['bg_image_id'])) {
                $stmt2 = $db->prepare("INSERT IGNORE INTO site_settings (setting_key, bg_image_id) VALUES ('active_cv', ?)");
                $stmt2->execute([$row['id']]);
                error_log("Migrated active_cv to site_settings: " . $row['id']);
            }
        }
    } catch (PDOException $e) {
        error_log("Failed to migrate active_cv: " . $e->getMessage());
    }
}

function recreateForeignKeys($db) {
    $fks = [
        "ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)",
        "ALTER TABLE users ADD CONSTRAINT fk_users_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE documents ADD CONSTRAINT fk_documents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
        "ALTER TABLE social_links ADD CONSTRAINT fk_sl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
        "ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
        "ALTER TABLE journey ADD CONSTRAINT fk_journey_bg_document FOREIGN KEY (background_document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE journey ADD CONSTRAINT fk_journey_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE projects ADD CONSTRAINT fk_projects_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE projects ADD CONSTRAINT fk_projects_bg_document FOREIGN KEY (background_document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE achievements ADD CONSTRAINT fk_achievements_icon_document FOREIGN KEY (icon_document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE achievements ADD CONSTRAINT fk_achievements_bg_document FOREIGN KEY (background_document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE entity_contents ADD CONSTRAINT fk_ec_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE entity_details ADD CONSTRAINT fk_ed_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL",
        "ALTER TABLE entity_content_details ADD CONSTRAINT fk_ecd_content FOREIGN KEY (entity_content_id) REFERENCES entity_contents(id) ON DELETE CASCADE",
        "ALTER TABLE entity_content_details ADD CONSTRAINT fk_ecd_image FOREIGN KEY (image_id) REFERENCES documents(id) ON DELETE SET NULL",
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

function migrateCleanImageUrls($db) {
    if (!tableExists($db, 'entity_contents') || !columnExists($db, 'entity_contents', 'image_url')) {
        return;
    }

    try {
        // Clean entity_contents: extract titles from image_url JSON objects, store as titles-only array
        $stmt = $db->query("SELECT id, image_url, image_ids, document_id FROM entity_contents WHERE image_url IS NOT NULL AND image_url != '' AND image_url != '[]'");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $update = $db->prepare("UPDATE entity_contents SET image_url = ? WHERE id = ?");
        $updated = 0;
        foreach ($rows as $row) {
            $parsed = json_decode($row['image_url'], true);
            if (!is_array($parsed)) continue;
            // Check if it's legacy format (contains objects with 'url' key)
            if (isset($parsed[0]['url'])) {
                $titles = [];
                $docIds = [];
                foreach ($parsed as $entry) {
                    $titles[] = $entry['title'] ?? '';
                    if (!empty($entry['document_id'])) {
                        $docIds[] = $entry['document_id'];
                    }
                }
                $titlesJson = json_encode($titles);
                $update->execute([$titlesJson, $row['id']]);
                // Update image_ids if not already set
                if (!empty($docIds) && empty($row['image_ids'])) {
                    $db->prepare("UPDATE entity_contents SET image_ids = ? WHERE id = ?")
                       ->execute([json_encode($docIds), $row['id']]);
                }
                $updated++;
            }
        }
        error_log("migrateCleanImageUrls: Updated " . $updated . " entity_contents rows");
    } catch (PDOException $e) {
        error_log("migrateCleanImageUrls failed: " . $e->getMessage());
    }

    if (!tableExists($db, 'entity_details') || !columnExists($db, 'entity_details', 'image_url')) {
        return;
    }

    try {
        // Clean entity_details: same treatment
        $stmt = $db->query("SELECT id, image_url, image_ids, document_id FROM entity_details WHERE image_url IS NOT NULL AND image_url != '' AND image_url != '[]'");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $update = $db->prepare("UPDATE entity_details SET image_url = ? WHERE id = ?");
        $updated = 0;
        foreach ($rows as $row) {
            $parsed = json_decode($row['image_url'], true);
            if (!is_array($parsed)) continue;
            if (isset($parsed[0]['url'])) {
                $titles = [];
                $docIds = [];
                foreach ($parsed as $entry) {
                    $titles[] = $entry['title'] ?? '';
                    if (!empty($entry['document_id'])) {
                        $docIds[] = $entry['document_id'];
                    }
                }
                $titlesJson = json_encode($titles);
                $update->execute([$titlesJson, $row['id']]);
                if (!empty($docIds) && empty($row['image_ids'])) {
                    $db->prepare("UPDATE entity_details SET image_ids = ? WHERE id = ?")
                       ->execute([json_encode($docIds), $row['id']]);
                }
                $updated++;
            }
        }
        error_log("migrateCleanImageUrls: Updated " . $updated . " entity_details rows");
    } catch (PDOException $e) {
        error_log("migrateCleanImageUrls failed: " . $e->getMessage());
    }
}

function migrateDropEntityContentRedundantColumns($db) {
    dropColumnSafe($db, 'entity_contents', 'image_url');
    dropColumnSafe($db, 'entity_contents', 'image_description');
}

function migrateDropEntityDetailRedundantColumns($db) {
    addColumnSafe($db, 'entity_details', 'icon_id', "VARCHAR(36) DEFAULT NULL AFTER heading");
    dropColumnSafe($db, 'entity_details', 'icons');
    dropColumnSafe($db, 'entity_details', 'image_url');
    dropColumnSafe($db, 'entity_details', 'image_description');
    dropColumnSafe($db, 'entity_details', 'image_ids');
}

function migrateToContentDetails($db) {
    if (!tableExists($db, 'entity_contents')) {
        return;
    }

    // Create entity_content_details table if not exists
    $db->exec("CREATE TABLE IF NOT EXISTS entity_content_details (
        id VARCHAR(36) PRIMARY KEY,
        entity_content_id VARCHAR(36) NOT NULL,
        image_id VARCHAR(36) DEFAULT NULL,
        title VARCHAR(255) DEFAULT '',
        embedded_url TEXT DEFAULT NULL,
        display_order INT DEFAULT 0,
        INDEX idx_entity_content (entity_content_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Add foreign keys (safe to run multiple times)
    try {
        $db->exec("ALTER TABLE entity_content_details ADD CONSTRAINT fk_ecd_content FOREIGN KEY (entity_content_id) REFERENCES entity_contents(id) ON DELETE CASCADE");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
            error_log("FK add error fk_ecd_content: " . $e->getMessage());
        }
    }
    try {
        $db->exec("ALTER TABLE entity_content_details ADD CONSTRAINT fk_ecd_image FOREIGN KEY (image_id) REFERENCES documents(id) ON DELETE SET NULL");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
            error_log("FK add error fk_ecd_image: " . $e->getMessage());
        }
    }

    // entity_contents may not have the legacy columns depending on schema state
    $hasImageIds = columnExists($db, 'entity_contents', 'image_ids');
    $hasDocumentId = columnExists($db, 'entity_contents', 'document_id');
    $hasEmbedUrls = columnExists($db, 'entity_contents', 'embed_urls');
    if (!$hasImageIds && !$hasDocumentId && !$hasEmbedUrls) {
        error_log("migrateToContentDetails: no legacy columns to migrate, skipping");
        return;
    }

    // Check if migration already ran (any content details already exist)
    try {
        $stmt = $db->query("SELECT COUNT(*) FROM entity_content_details");
        if ($stmt->fetchColumn() > 0) {
            error_log("migrateToContentDetails: Already migrated, skipping");
            return;
        }
    } catch (PDOException $e) {
        error_log("migrateToContentDetails: count check failed: " . $e->getMessage());
    }

    // Migrate legacy entity_contents → entity_content_details (only existing columns)
    $selectCols = ['id'];
    if ($hasImageIds) $selectCols[] = 'image_ids';
    if ($hasDocumentId) $selectCols[] = 'document_id';
    if ($hasEmbedUrls) $selectCols[] = 'embed_urls';

    try {
        $stmt = $db->query("SELECT " . implode(', ', $selectCols) . " FROM entity_contents");
    } catch (PDOException $e) {
        error_log("migrateToContentDetails: SELECT failed: " . $e->getMessage());
        return;
    }
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $insertDetail = $db->prepare(
        "INSERT INTO entity_content_details (id, entity_content_id, image_id, title, embedded_url, display_order) VALUES (?, ?, ?, ?, ?, ?)"
    );
    $migrated = 0;

    foreach ($rows as $row) {
        $order = 0;

        // 1. Migrate image_ids (JSON array of doc IDs or objects with id+title)
        $imageIds = !empty($row['image_ids']) ? json_decode($row['image_ids'], true) : [];
        if (is_array($imageIds)) {
            foreach ($imageIds as $entry) {
                $docId = null;
                $title = '';
                if (is_array($entry)) {
                    $docId = $entry['id'] ?? null;
                    $title = $entry['title'] ?? '';
                } else {
                    $docId = $entry;
                }
                if (!empty($docId)) {
                    $insertDetail->execute([
                        generateUUID(), $row['id'], $docId, $title, null, $order++
                    ]);
                }
            }
        }

        // 2. Migrate document_id (if exists and not already in image_ids)
        if (!empty($row['document_id'])) {
            $alreadyMigrated = false;
            if (is_array($imageIds)) {
                foreach ($imageIds as $entry) {
                    $existingDocId = is_array($entry) ? ($entry['id'] ?? null) : $entry;
                    if ($existingDocId === $row['document_id']) {
                        $alreadyMigrated = true;
                        break;
                    }
                }
            }
            if (!$alreadyMigrated) {
                $insertDetail->execute([
                    generateUUID(), $row['id'], $row['document_id'], '', null, $order++
                ]);
            }
        }

        // 3. Migrate embed_urls (JSON array of embed objects → one row per embed)
        $embeds = !empty($row['embed_urls']) ? json_decode($row['embed_urls'], true) : [];
        if (is_array($embeds)) {
            foreach ($embeds as $embed) {
                $embedUrl = is_array($embed) ? ($embed['url'] ?? null) : null;
                if (!empty($embedUrl)) {
                    $insertDetail->execute([
                        generateUUID(), $row['id'], null, '', json_encode($embed), $order++
                    ]);
                }
            }
        }

        $migrated++;
    }

    error_log("migrateToContentDetails: Migrated " . $migrated . " academic content sections");
}

function migrateToEntityLinks($db) {
    // Create entity_links table if not exists
    $db->exec("CREATE TABLE IF NOT EXISTS entity_links (
        id VARCHAR(36) PRIMARY KEY,
        entity_type ENUM('journey', 'project', 'academic_project', 'achievement') NOT NULL,
        entity_id VARCHAR(36) NOT NULL,
        label VARCHAR(100) NOT NULL DEFAULT '',
        url VARCHAR(500) NOT NULL DEFAULT '',
        display_order INT DEFAULT 0,
        INDEX idx_entity (entity_type, entity_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Check if migration already ran
    try {
        $stmt = $db->query("SELECT COUNT(*) FROM entity_links");
        if ($stmt->fetchColumn() > 0) {
            error_log("migrateToEntityLinks: Already migrated, skipping");
            return;
        }
    } catch (PDOException $e) {
        error_log("migrateToEntityLinks: count check failed: " . $e->getMessage());
    }

    $insertLink = $db->prepare(
        "INSERT INTO entity_links (id, entity_type, entity_id, label, url, display_order) VALUES (?, ?, ?, ?, ?, ?)"
    );

    // Migrate journey.url_of_company → entity_links (type='journey')
    try {
        $stmt = $db->query("SELECT id, url_of_company FROM journey WHERE url_of_company IS NOT NULL AND url_of_company != ''");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $migrated = 0;
        foreach ($rows as $row) {
            $insertLink->execute([
                generateUUID(), 'journey', $row['id'], 'Website', $row['url_of_company'], 0
            ]);
            $migrated++;
        }
        error_log("migrateToEntityLinks: Migrated " . $migrated . " journey links");
    } catch (PDOException $e) {
        error_log("migrateToEntityLinks: journey migration failed: " . $e->getMessage());
    }

    // Migrate projects.source_code_link → entity_links (type='project')
    try {
        $stmt = $db->query("SELECT id, source_code_link FROM projects WHERE source_code_link IS NOT NULL AND source_code_link != ''");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $migrated = 0;
        foreach ($rows as $row) {
            $insertLink->execute([
                generateUUID(), 'project', $row['id'], 'Source Code', $row['source_code_link'], 0
            ]);
            $migrated++;
        }
        error_log("migrateToEntityLinks: Migrated " . $migrated . " project links");
    } catch (PDOException $e) {
        error_log("migrateToEntityLinks: project migration failed: " . $e->getMessage());
    }
}

function migrateToEntityPromotions($db) {
    $db->exec("CREATE TABLE IF NOT EXISTS entity_promotions (
        id VARCHAR(36) PRIMARY KEY,
        journey_id VARCHAR(36) NOT NULL,
        year DATE NOT NULL,
        position VARCHAR(255) NOT NULL DEFAULT '',
        designation VARCHAR(255) NOT NULL DEFAULT '',
        description TEXT,
        display_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_journey (journey_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    try {
        $db->exec("ALTER TABLE entity_promotions ADD CONSTRAINT fk_ep_journey FOREIGN KEY (journey_id) REFERENCES journey(id) ON DELETE CASCADE");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
            error_log("FK add error fk_ep_journey: " . $e->getMessage());
        }
    }

    $db->exec("CREATE TABLE IF NOT EXISTS entity_promotion_contents (
        id VARCHAR(36) PRIMARY KEY,
        promotion_id VARCHAR(36) NOT NULL,
        heading VARCHAR(255) DEFAULT '',
        content_text TEXT,
        display_order INT DEFAULT 0,
        INDEX idx_promotion (promotion_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    try {
        $db->exec("ALTER TABLE entity_promotion_contents ADD CONSTRAINT fk_epc_promotion FOREIGN KEY (promotion_id) REFERENCES entity_promotions(id) ON DELETE CASCADE");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
            error_log("FK add error fk_epc_promotion: " . $e->getMessage());
        }
    }

    $db->exec("CREATE TABLE IF NOT EXISTS entity_promotion_content_details (
        id VARCHAR(36) PRIMARY KEY,
        promotion_content_id VARCHAR(36) NOT NULL,
        image_id VARCHAR(36) DEFAULT NULL,
        title VARCHAR(255) DEFAULT '',
        display_order INT DEFAULT 0,
        INDEX idx_promo_content (promotion_content_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    try {
        $db->exec("ALTER TABLE entity_promotion_content_details ADD CONSTRAINT fk_epcd_content FOREIGN KEY (promotion_content_id) REFERENCES entity_promotion_contents(id) ON DELETE CASCADE");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
            error_log("FK add error fk_epcd_content: " . $e->getMessage());
        }
    }

    try {
        $db->exec("ALTER TABLE entity_promotion_content_details ADD CONSTRAINT fk_epcd_image FOREIGN KEY (image_id) REFERENCES documents(id) ON DELETE SET NULL");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') === false && strpos($e->getMessage(), 'already exists') === false) {
            error_log("FK add error fk_epcd_image: " . $e->getMessage());
        }
    }

    // Migrate JSON content_items from entity_promotions to new tables
    try {
        $stmt = $db->query("SELECT id, content_items FROM entity_promotions WHERE content_items IS NOT NULL AND content_items != '[]' AND content_items != 'null'");
        $promos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $insertContent = $db->prepare(
            "INSERT INTO entity_promotion_contents (id, promotion_id, heading, content_text, display_order) VALUES (?, ?, ?, ?, ?)"
        );
        $insertDetail = $db->prepare(
            "INSERT INTO entity_promotion_content_details (id, promotion_content_id, image_id, title, display_order) VALUES (?, ?, ?, ?, ?)"
        );
        $getDoc = $db->prepare("SELECT id FROM documents WHERE relative_path = ? OR absolute_path = ? LIMIT 1");
        
        $migrated = 0;
        foreach ($promos as $promo) {
            $contentItems = json_decode($promo['content_items'], true);
            if (!is_array($contentItems)) continue;
            
            foreach ($contentItems as $idx => $item) {
                $contentId = generateUUID();
                $insertContent->execute([
                    $contentId,
                    $promo['id'],
                    $item['heading'] ?? '',
                    $item['content_text'] ?? '',
                    $item['display_order'] ?? $idx
                ]);
                
                $imageUrls = $item['image_url'] ?? [];
                $imageTitles = $item['image_titles'] ?? [];
                if (is_string($imageUrls)) {
                    $imageUrls = json_decode($imageUrls, true) ?? [];
                }
                
                foreach ($imageUrls as $imgIdx => $img) {
                    $imageUrl = is_array($img) ? ($img['url'] ?? $img['icon'] ?? '') : $img;
                    $docId = null;
                    if (!empty($imageUrl)) {
                        $getDoc->execute([$imageUrl, $imageUrl]);
                        $docRow = $getDoc->fetch(PDO::FETCH_ASSOC);
                        if ($docRow) $docId = $docRow['id'];
                    }
                    $insertDetail->execute([
                        generateUUID(),
                        $contentId,
                        $docId,
                        $imageTitles[$imgIdx] ?? ($img['title'] ?? ''),
                        $imgIdx
                    ]);
                }
                $migrated++;
            }
        }
        error_log("migrateToEntityPromotions: Migrated " . $migrated . " content items to new tables");
    } catch (PDOException $e) {
        error_log("migrateToEntityPromotions: content migration failed: " . $e->getMessage());
    }

    // Drop the content_items JSON column if it exists
    try {
        $db->exec("ALTER TABLE entity_promotions DROP COLUMN content_items");
    } catch (PDOException $e) {
        // Column doesn't exist or already dropped
    }

    try {
        $stmt = $db->query("SELECT COUNT(*) FROM entity_promotions");
        if ($stmt->fetchColumn() > 0) {
            error_log("migrateToEntityPromotions: Already migrated, skipping");
            return;
        }
    } catch (PDOException $e) {
        error_log("migrateToEntityPromotions: count check failed: " . $e->getMessage());
    }

    try {
        $stmt = $db->query("SELECT id, start_date, designation, office_name FROM journey WHERE start_date IS NOT NULL");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $insertPromo = $db->prepare(
            "INSERT INTO entity_promotions (id, journey_id, year, position, display_order) VALUES (?, ?, ?, ?, ?)"
        );
        $migrated = 0;
        foreach ($rows as $row) {
            $insertPromo->execute([
                generateUUID(),
                $row['id'],
                $row['start_date'],
                $row['designation'] ?? '',
                0
            ]);
            $migrated++;
        }
        error_log("migrateToEntityPromotions: Migrated " . $migrated . " initial promotions");
    } catch (PDOException $e) {
        error_log("migrateToEntityPromotions: migration failed: " . $e->getMessage());
    }
}

function migrateAddPromotionDates($db) {
    addColumnSafe($db, 'entity_promotions', 'start_date', "DATE DEFAULT NULL AFTER journey_id");
    addColumnSafe($db, 'entity_promotions', 'end_date', "DATE DEFAULT NULL AFTER start_date");

    // Copy existing year values into start_date
    try {
        $stmt = $db->query("SELECT id, year FROM entity_promotions WHERE start_date IS NULL AND year IS NOT NULL");
        while ($row = $stmt->fetch()) {
            $db->prepare("UPDATE entity_promotions SET start_date = ? WHERE id = ?")->execute([$row['year'], $row['id']]);
        }
    } catch (PDOException $e) {
        error_log("migrateAddPromotionDates: data copy failed: " . $e->getMessage());
    }
}

function migrateDropEntityContentUnusedColumns($db) {
    // Drop FK constraint on document_id first
    try {
        $db->exec("ALTER TABLE entity_contents DROP FOREIGN KEY fk_ec_document");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'check that column/key exists') === false) {
            error_log("migrateDropEntityContentUnusedColumns: FK drop: " . $e->getMessage());
        }
    }
    dropColumnSafe($db, 'entity_contents', 'document_id');
    dropColumnSafe($db, 'entity_contents', 'image_ids');
    dropColumnSafe($db, 'entity_contents', 'embed_urls');
    dropColumnSafe($db, 'entity_contents', 'image_url');
    dropColumnSafe($db, 'entity_contents', 'image_description');
}
