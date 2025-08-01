-- 用户表
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    nickname VARCHAR(50),
    avatar VARCHAR(255),
    gender ENUM('male', 'female', 'other') DEFAULT 'other',
    birthday DATE,
    id_card VARCHAR(18),
    address TEXT,
    occupation VARCHAR(100),
    education VARCHAR(100),
    income VARCHAR(50),
    risk_level ENUM('conservative', 'moderate', 'aggressive') DEFAULT 'moderate',
    investment_experience ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    investment_goal TEXT,
    investment_period ENUM('short', 'medium', 'long') DEFAULT 'medium',
    status ENUM('active', 'inactive', 'frozen', 'pending', 'deleted') DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT FALSE,
    is_certified BOOLEAN DEFAULT FALSE,
    last_login_time BIGINT,
    login_count INT DEFAULT 0,
    register_time BIGINT NOT NULL,
    update_time BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_status (status),
    INDEX idx_register_time (register_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 用户资料表
CREATE TABLE user_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    real_name VARCHAR(50),
    id_card VARCHAR(18),
    id_card_front VARCHAR(255),
    id_card_back VARCHAR(255),
    bank_card VARCHAR(20),
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    emergency_contact VARCHAR(50),
    emergency_phone VARCHAR(20),
    occupation VARCHAR(100),
    income VARCHAR(50),
    investment_experience TEXT,
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    verification_time BIGINT,
    reject_reason TEXT,
    has_trade_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_verification_status (verification_status),
    UNIQUE KEY uk_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户资料表';

-- 用户设置表
CREATE TABLE user_settings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    theme ENUM('light', 'dark', 'auto') DEFAULT 'light',
    language ENUM('zh-CN', 'en-US') DEFAULT 'zh-CN',
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    currency ENUM('CNY', 'USD', 'HKD') DEFAULT 'CNY',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format ENUM('12h', '24h') DEFAULT '24h',
    notification_settings JSON,
    privacy_settings JSON,
    security_settings JSON,
    trading_settings JSON,
    display_settings JSON,
    updated_at BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户设置表';

-- 用户设备表
CREATE TABLE user_devices (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    device_type ENUM('mobile', 'tablet', 'desktop') DEFAULT 'mobile',
    device_name VARCHAR(100) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    os_version VARCHAR(50),
    app_version VARCHAR(50),
    ip VARCHAR(45),
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_bound BOOLEAN DEFAULT FALSE,
    last_login_time BIGINT,
    bind_time BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_device_id (device_id),
    INDEX idx_is_active (is_active),
    UNIQUE KEY uk_user_device (user_id, device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户设备表';

-- 用户登录历史表
CREATE TABLE user_login_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    login_time BIGINT NOT NULL,
    logout_time BIGINT,
    login_ip VARCHAR(45),
    login_location VARCHAR(100),
    device_type VARCHAR(50),
    device_name VARCHAR(100),
    platform VARCHAR(50),
    status ENUM('success', 'failed') DEFAULT 'success',
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_login_time (login_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户登录历史表';

-- 用户活动表
CREATE TABLE user_activities (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('login', 'logout', 'trade', 'view', 'search', 'setting', 'other') NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(255),
    details JSON,
    ip VARCHAR(45),
    location VARCHAR(100),
    device VARCHAR(100),
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户活动表';

-- 用户消息表
CREATE TABLE user_messages (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('system', 'order', 'deal', 'position', 'fund', 'news', 'marketing') NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    summary VARCHAR(500),
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    expire_time BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_time BIGINT,
    delete_time BIGINT,
    related_id VARCHAR(36),
    related_type VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户消息表';

-- 用户反馈表
CREATE TABLE user_feedbacks (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('bug', 'feature', 'improvement', 'complaint', 'suggestion') NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    attachments JSON,
    status ENUM('pending', 'processing', 'resolved', 'closed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolve_time BIGINT,
    resolver_id VARCHAR(36),
    response TEXT,
    rating INT,
    comment TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户反馈表';

-- 验证码表
CREATE TABLE verification_codes (
    id VARCHAR(36) PRIMARY KEY,
    target VARCHAR(100) NOT NULL,
    type ENUM('email', 'phone') NOT NULL,
    purpose ENUM('register', 'login', 'reset_password', 'verify_email', 'verify_phone') NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at BIGINT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_target (target),
    INDEX idx_type (type),
    INDEX idx_purpose (purpose),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_used (is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='验证码表';

-- 系统配置表
CREATE TABLE system_config (
    id VARCHAR(36) PRIMARY KEY,
    `key` VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description VARCHAR(500),
    type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    is_system BOOLEAN DEFAULT FALSE,
    updated_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (`key`),
    INDEX idx_is_system (is_system)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- 插入默认系统配置
INSERT INTO system_config (id, `key`, value, description, type, is_system) VALUES
('1', 'app_name', 'Trade App', '应用名称', 'string', true),
('2', 'app_version', '1.0.0', '应用版本', 'string', true),
('3', 'maintenance_mode', 'false', '维护模式', 'boolean', true),
('4', 'allow_registration', 'true', '允许注册', 'boolean', true),
('5', 'default_user_role', 'user', '默认用户角色', 'string', true),
('6', 'password_min_length', '8', '密码最小长度', 'number', true),
('7', 'password_require_special', 'true', '密码需要特殊字符', 'boolean', true),
('8', 'session_timeout', '7200', '会话超时时间（秒）', 'number', true),
('9', 'max_login_attempts', '5', '最大登录尝试次数', 'number', true),
('10', 'lockout_duration', '900', '锁定持续时间（秒）', 'number', true),
('11', 'email_verification_required', 'true', '需要邮箱验证', 'boolean', true),
('12', 'phone_verification_required', 'false', '需要手机验证', 'boolean', true),
('13', 'upload_max_size', '10485760', '上传文件最大大小（字节）', 'number', true),
('14', 'allowed_file_types', 'jpg,jpeg,png,pdf,doc,docx', '允许的文件类型', 'string', true),
('15', 'api_rate_limit', '100', 'API速率限制（每15分钟）', 'number', true);