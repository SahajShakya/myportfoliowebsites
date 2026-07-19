<?php

class SmtpMail {
    private $host;
    private $port;
    private $username;
    private $password;
    private $fromEmail;
    private $fromName;

    public function __construct($config) {
        $this->host     = $config['host']     ?? 'smtp.gmail.com';
        $this->port     = $config['port']     ?? 587;
        $this->username = $config['username'] ?? '';
        $this->password = $config['password'] ?? '';
        $this->fromEmail = $config['from_email'] ?? '';
        $this->fromName  = $config['from_name']  ?? 'Portfolio Contact';
    }

    public function send($toEmail, $toName, $subject, $htmlBody) {
        $errno = 0;
        $errstr = '';

        $fp = @fsockopen($this->host, $this->port, $errno, $errstr, 30);
        if (!$fp) {
            throw new Exception("SMTP connection failed: $errstr ($errno)");
        }

        $this->readResponse($fp);
        $this->sendCommand($fp, "EHLO localhost");
        $this->sendCommand($fp, "STARTTLS");
        $tlsMethods = STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
        if (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT')) {
            $tlsMethods |= STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;
        }
        $crypto = @stream_socket_enable_crypto($fp, true, $tlsMethods);
        if (!$crypto) {
            $crypto = @stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT);
        }
        if (!$crypto) {
            fclose($fp);
            throw new Exception("TLS handshake failed");
        }
        $this->sendCommand($fp, "EHLO localhost");

        $this->sendCommand($fp, "AUTH LOGIN");
        $this->sendCommand($fp, base64_encode($this->username));
        $this->sendCommand($fp, base64_encode($this->password));

        $this->sendCommand($fp, "MAIL FROM:<{$this->fromEmail}>");
        $this->sendCommand($fp, "RCPT TO:<{$toEmail}>");
        $this->sendCommand($fp, "DATA");

        $headers  = "From: =?UTF-8?B?" . base64_encode($this->fromName) . "?= <{$this->fromEmail}>\r\n";
        $headers .= "To: =?UTF-8?B?" . base64_encode($toName) . "?= <{$toEmail}>\r\n";
        $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "Date: " . date('r') . "\r\n";
        $headers .= "\r\n";

        $this->sendRaw($fp, $headers . $htmlBody . "\r\n");
        $this->sendCommand($fp, ".");
        $this->sendCommand($fp, "QUIT");

        fclose($fp);
        return true;
    }

    private function readResponse($fp) {
        $response = '';
        while (true) {
            $line = fgets($fp, 512);
            if ($line === false) break;
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $response;
    }

    private function sendCommand($fp, $command) {
        fputs($fp, $command . "\r\n");
        return $this->readResponse($fp);
    }

    private function sendRaw($fp, $data) {
        fputs($fp, $data);
    }
}
