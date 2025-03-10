#!/usr/bin/env python3
import os
import sys
import bcrypt
import getpass
import psycopg2
from dotenv import load_dotenv

# Colors for output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'

def print_info(message):
    print(f"{YELLOW}[*] {message}{RESET}")

def print_success(message):
    print(f"{GREEN}[+] {message}{RESET}")

def print_error(message):
    print(f"{RED}[-] {message}{RESET}")

def get_db_connection():
    """Establish connection to the database"""
    try:
        # Try to load environment variables from .env file
        load_dotenv()
        
        # Default connection details from docker-compose
        db_host = os.getenv('DB_HOST', 'localhost')
        db_port = os.getenv('DB_PORT', '5432')
        db_name = os.getenv('POSTGRES_DB', 'grc_dashboard')
        db_user = os.getenv('POSTGRES_USER', 'postgres')
        db_pass = os.getenv('POSTGRES_PASSWORD', 'postgres')
        
        print_info(f"Connecting to database at {db_host}:{db_port}...")
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            dbname=db_name,
            user=db_user,
            password=db_pass
        )
        return conn
    except Exception as e:
        print_error(f"Database connection error: {str(e)}")
        sys.exit(1)

def check_user_exists(conn, username):
    """Check if user exists in the database"""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM \"user\" WHERE username = %s", (username,))
        user = cursor.fetchone()
        cursor.close()
        return user is not None
    except Exception as e:
        print_error(f"Error checking user: {str(e)}")
        return False

def update_password(conn, username, new_password):
    """Update user's password in the database"""
    try:
        # Hash the new password
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE \"user\" SET password_hash = %s WHERE username = %s",
            (password_hash.decode('utf-8'), username)
        )
        conn.commit()
        cursor.close()
        return True
    except Exception as e:
        print_error(f"Error updating password: {str(e)}")
        conn.rollback()
        return False

def main():
    print_info("Cybether Password Reset Tool")
    print_info("============================")
    
    # Connect to the database
    conn = get_db_connection()
    
    # Get username to update
    username = input("Enter username to reset (default: admin): ") or "admin"
    
    # Check if user exists
    if not check_user_exists(conn, username):
        print_error(f"User '{username}' does not exist in the database.")
        conn.close()
        sys.exit(1)
    
    # Get and confirm new password
    while True:
        new_password = getpass.getpass("Enter new password: ")
        if len(new_password) < 8:
            print_error("Password must be at least 8 characters long.")
            continue
            
        confirm_password = getpass.getpass("Confirm new password: ")
        if new_password != confirm_password:
            print_error("Passwords do not match. Please try again.")
            continue
        
        break
    
    # Update the password
    if update_password(conn, username, new_password):
        print_success(f"Password for user '{username}' updated successfully!")
    else:
        print_error("Failed to update password. Please check the logs.")
    
    # Close the database connection
    conn.close()

if __name__ == "__main__":
    main()