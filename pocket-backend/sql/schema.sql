CREATE DATABASE IF NOT EXISTS pocket CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pocket;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36) PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(120),
  currency      VARCHAR(8) NOT NULL DEFAULT 'INR',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id          CHAR(36) PRIMARY KEY,
  user_id     CHAR(36), -- NULL for system categories
  name        VARCHAR(100) NOT NULL,
  type        ENUM('income', 'expense') NOT NULL,
  icon        VARCHAR(50),
  color       VARCHAR(20),
  parent_id   CHAR(36),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id          CHAR(36) PRIMARY KEY,
  user_id     CHAR(36) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  amount      DECIMAL(14,2) NOT NULL,
  type        ENUM('income', 'expense') NOT NULL,
  category_id CHAR(36),
  date        DATETIME NOT NULL, -- Stored in UTC
  note        TEXT,
  receipt     LONGTEXT,
  tags        TEXT, -- Comma-separated or JSON
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tx_user_date (user_id, date),
  CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tx_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  user_id     CHAR(36) NOT NULL,
  category_id CHAR(36) NOT NULL,
  `limit`     DECIMAL(14,2) NOT NULL,
  period      ENUM('monthly', 'yearly') NOT NULL DEFAULT 'monthly',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, category_id),
  CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_budget_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Recurring Transactions
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id          CHAR(36) PRIMARY KEY,
  user_id     CHAR(36) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  amount      DECIMAL(14,2) NOT NULL,
  type        ENUM('income', 'expense') NOT NULL,
  category_id CHAR(36) NOT NULL,
  frequency   ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
  start_date  DATETIME NOT NULL,
  next_date   DATETIME NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rec_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rec_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;
