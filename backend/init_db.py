from app import app, db
from models.models import User
import bcrypt
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    with app.app_context():
        try:
            # Create tables
            logger.info("Creating database tables...")
            db.create_all()
            logger.info("Database tables created successfully")

            # Check if admin user exists
            logger.info("Checking for admin user...")
            admin = User.query.filter_by(username='admin').first()
            if not admin:
                # Create admin user
                logger.info("Creating admin user...")
                password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
                admin = User(
                    username='admin',
                    password_hash=password.decode('utf-8'),
                    is_admin=True
                )
                db.session.add(admin)
                db.session.commit()
                logger.info("Admin user created successfully")
            else:
                logger.info("Admin user already exists")

        except Exception as e:
            logger.error(f"Error in database initialization: {str(e)}")
            raise

if __name__ == '__main__':
    init_db()