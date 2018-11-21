create table novel_list (
  novel_id INT NOT NULL AUTO_INCREMENT,
  novel_name VARCHAR(40) NOT NULL,
  novel_category VARCHAR(40),
  novel_author VARCHAR(40) NOT NULL,
  novel_cover VARCHAR(255),
  novel_catalog VARCHAR(1024),
  novel_sources VARCHAR(2048),
  novel_brief VARCHAR(2048),
  create_time DATETIME,
  update_time DATETIME,
  PRIMARY KEY (novel_id),
  INDEX list(novel_id, novel_name, novel_category, novel_author, novel_brief)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

create table novel_list_temp (
  novel_id INT NOT NULL AUTO_INCREMENT,
  novel_name VARCHAR(40),
  novel_category VARCHAR(40),
  novel_author VARCHAR(40) NOT NULL,
  novel_sources VARCHAR(1024),
  create_time DATETIME,
  PRIMARY KEY (novel_id),
  INDEX temp(novel_id, novel_name, novel_category, novel_author, novel_sources)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

create table novel_catalog (
  catalog_id INT NOT NULL AUTO_INCREMENT,
  novel_id INT NOT NULL,
  catalog_name VARCHAR(40),
  content_sources VARCHAR(1024),
  catalog_index INT NOT NULL,
  create_time DATETIME,
  update_time DATETIME,
  PRIMARY KEY (catalog_id),
  INDEX catalog(catalog_id, novel_id, catalog_name, content_sources)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

create table novel_category (
  category_id INT NOT NULL AUTO_INCREMENT,
  category_name VARCHAR(40),
  create_time DATETIME,
  PRIMARY KEY (category_id),
  INDEX category(category_id, category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

create table novel_author (
  author_id INT NOT NULL AUTO_INCREMENT,
  author_name VARCHAR(40),
  create_time DATETIME,
  PRIMARY KEY (author_id),
  INDEX author(author_id, author_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

create table novel_sources (
  sources_id INT NOT NULL AUTO_INCREMENT,
  sources_name VARCHAR(40),
  create_time DATETIME,
  PRIMARY KEY (sources_id),
  INDEX sources(sources_id, sources_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;