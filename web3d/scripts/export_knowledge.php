<?php
/**
 * Exports the knowledge base from MySQL into chat-worker/knowledge.json
 * (same chunks the PHP RAG service uses), for bundling into the Cloudflare Worker.
 *
 * Usage:
 *   php scripts/export_knowledge.php            # local DB
 *   php scripts/export_knowledge.php production # production DB
 */

$useProduction = in_array('production', $argv) || in_array('prod', $argv);

require_once __DIR__ . '/../public/api/config/database.php';

$conn = (new Database())->getConnection();

$chunks = [];

function addChunk(&$chunks, $text, $metadata) {
    $text = trim(strip_tags((string)$text));
    if ($text === '') return;
    $chunks[] = [
        'chunk_text' => $text,
        'metadata' => $metadata,
    ];
}

function entityContents($conn, $entityType, $entityId, &$chunks) {
    $stmt = $conn->prepare(
        "SELECT content_text FROM entity_contents
         WHERE entity_type = ? AND entity_id = ? AND content_text IS NOT NULL"
    );
    $stmt->execute([$entityType, $entityId]);
    foreach ($stmt->fetchAll() as $row) {
        addChunk($chunks, $row['content_text'], [
            'type' => $entityType . '_detail',
            'entity_type' => $entityType,
            'entity_id' => $entityId,
        ]);
    }
}

function entityDetails($conn, $entityType, $entityId, &$chunks) {
    $stmt = $conn->prepare(
        "SELECT contents FROM entity_details
         WHERE entity_type = ? AND entity_id = ? AND contents IS NOT NULL"
    );
    $stmt->execute([$entityType, $entityId]);
    foreach ($stmt->fetchAll() as $row) {
        addChunk($chunks, $row['contents'], [
            'type' => $entityType . '_detail',
            'entity_type' => $entityType,
            'entity_id' => $entityId,
        ]);
    }
}

function entityTags($conn, $entityType, $entityId) {
    $stmt = $conn->prepare("SELECT tag FROM entity_tags WHERE entity_type = ? AND entity_id = ?");
    $stmt->execute([$entityType, $entityId]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

// users
try {
    $stmt = $conn->prepare("SELECT name, email, phone, bio, tagline FROM users ORDER BY created_at ASC LIMIT 1");
    $stmt->execute();
    $user = $stmt->fetch();
    if ($user) {
        $text = "Sahaj Shakya is a professional ";
        if ($user['tagline']) $text .= $user['tagline'] . ". ";
        if ($user['bio']) $text .= $user['bio'] . ". ";
        $text .= "Contact: " . ($user['email'] ?? '') . ". ";
        if ($user['phone']) $text .= "Phone: " . $user['phone'] . ".";
        addChunk($chunks, $text, ['type' => 'user_info', 'title' => 'About Sahaj Shakya']);
    }
} catch (PDOException $e) {}

// journey
try {
    foreach ($conn->query("SELECT id, title, office_name, designation, start_date, end_date, description, contents FROM journey") as $j) {
        $text = "Work Experience: {$j['designation']} at {$j['office_name']}. ";
        $text .= "Project: {$j['title']}. ";
        $text .= "Duration: {$j['start_date']} to " . ($j['end_date'] ?: 'Present') . ". ";
        if ($j['description']) $text .= strip_tags($j['description']) . " ";
        if ($j['contents']) $text .= strip_tags($j['contents']) . " ";
        addChunk($chunks, $text, [
            'type' => 'work_experience',
            'title' => $j['title'],
            'company' => $j['office_name'],
            'designation' => $j['designation'],
        ]);
        entityContents($conn, 'journey', $j['id'], $chunks);
    }
} catch (PDOException $e) {}

// academics
try {
    foreach ($conn->query("SELECT id, title, university_name, college_name, start_date, end_date, description FROM academics ORDER BY start_date ASC") as $a) {
        $text = "Education: {$a['title']}";
        if ($a['college_name']) $text .= ", {$a['college_name']}";
        if ($a['university_name']) $text .= ", {$a['university_name']}";
        if ($a['start_date']) $text .= ". Duration: {$a['start_date']} to " . ($a['end_date'] ?: 'Present');
        if ($a['description']) $text .= ". " . strip_tags($a['description']);
        addChunk($chunks, $text, ['type' => 'education', 'title' => $a['title']]);
        entityContents($conn, 'academic', $a['id'], $chunks);
    }
} catch (PDOException $e) {}

// projects
try {
    foreach ($conn->query("SELECT id, name, category, description, contents, source_code_link FROM projects") as $p) {
        $isAcademic = ($p['category'] ?? 'workproject') === 'academicsproject';
        $text = $isAcademic ? "Academic Project: {$p['name']}. " : "Project: {$p['name']}. ";
        if ($p['description']) $text .= strip_tags($p['description']) . " ";
        if ($p['contents']) $text .= strip_tags($p['contents']) . " ";
        if ($p['source_code_link']) $text .= "Source code: {$p['source_code_link']} ";
        $tags = entityTags($conn, 'project', $p['id']);
        if (!empty($tags)) $text .= "Technologies: " . implode(', ', $tags) . ". ";
        addChunk($chunks, $text, [
            'type' => $isAcademic ? 'academic_project' : 'project',
            'category' => $p['category'] ?? 'workproject',
            'title' => $p['name'],
            'tags' => $tags,
        ]);
        entityContents($conn, 'project', $p['id'], $chunks);
        entityDetails($conn, 'project', $p['id'], $chunks);
    }
} catch (PDOException $e) {}

// achievements
try {
    foreach ($conn->query("SELECT id, name, description, contents FROM achievements") as $a) {
        $text = "Achievement: {$a['name']}. ";
        if ($a['description']) $text .= strip_tags($a['description']) . " ";
        if ($a['contents']) $text .= strip_tags($a['contents']) . " ";
        $tags = entityTags($conn, 'achievement', $a['id']);
        if (!empty($tags)) $text .= "Tags: " . implode(', ', $tags) . ". ";
        addChunk($chunks, $text, ['type' => 'achievement', 'title' => $a['name'], 'tags' => $tags]);
        entityDetails($conn, 'achievement', $a['id'], $chunks);
    }
} catch (PDOException $e) {}

// testimonials
try {
    foreach ($conn->query("SELECT id, testimonial, name, designation, company FROM testimonials") as $t) {
        $text = "Testimonial from {$t['name']}";
        if ($t['designation']) $text .= ", {$t['designation']}";
        if ($t['company']) $text .= " at {$t['company']}";
        $text .= ": {$t['testimonial']}";
        addChunk($chunks, $text, [
            'type' => 'testimonial',
            'author' => $t['name'],
            'designation' => $t['designation'],
            'company' => $t['company'],
        ]);
    }
} catch (PDOException $e) {}

// photography
try {
    foreach ($conn->query("SELECT id, title, description FROM photography") as $ph) {
        $text = "Photography Album: {$ph['title']}. ";
        if ($ph['description']) $text .= strip_tags($ph['description']) . " ";
        $tags = entityTags($conn, 'photography', $ph['id']);
        if (!empty($tags)) $text .= "Tags: " . implode(', ', $tags) . ". ";
        addChunk($chunks, $text, ['type' => 'photography', 'title' => $ph['title'], 'tags' => $tags]);
    }
} catch (PDOException $e) {}

$dir = __DIR__ . '/../chat-worker';
if (!is_dir($dir)) mkdir($dir, 0777, true);

$outPath = $dir . '/knowledge.json';
file_put_contents(
    $outPath,
    json_encode(['chunks' => $chunks], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)
);

echo "Exported " . count($chunks) . " knowledge chunks to {$outPath}\n";
