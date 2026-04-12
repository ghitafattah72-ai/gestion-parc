import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database Configuration - Using SQLite for development
    # For production with MySQL, set DB_TYPE environment variable to 'mysql'
    db_type = os.getenv('DB_TYPE', 'sqlite')
    
    if db_type == 'mysql':
        MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
        MYSQL_USER = os.getenv('MYSQL_USER', 'root')
        MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
        MYSQL_DB = os.getenv('MYSQL_DB', 'gestion_parc')
        MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
        SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}'
    else:
        # SQLite for development
        db_path = os.path.join(os.path.dirname(__file__), 'gestion_parc.db')
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{db_path}'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Flask Configuration
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max file size
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    
    # Create upload folder if it doesn't exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
