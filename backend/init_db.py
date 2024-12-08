from app import app, db
from models.models import User
import bcrypt

def init_db():
    with app.app_context():
        # Create tables
        db.create_all()

        # Check if admin user exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            # Create admin user
            password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
            admin = User(
                username='admin',
                password_hash=password.decode('utf-8'),
                is_admin=True
            )
            db.session.add(admin)
            db.session.commit()
            print("Admin user created successfully")

if __name__ == '__main__':
    init_db()