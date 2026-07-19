<?php

function retrainChatbot($db, $tableName) {
    try {
        require_once __DIR__ . '/../services/KnowledgeBuilder.php';
        $builder = new KnowledgeBuilder($db);
        $builder->buildTable($tableName);
    } catch (Exception $e) {
        error_log("Chatbot retrain failed for {$tableName}: " . $e->getMessage());
    }
}
