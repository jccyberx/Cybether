from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from models.models import MaturityTrendPoint, db, User, ThreatLevel, MaturityRating, Risk, Project, ComplianceFramework
from config import Config
from functools import wraps
import bcrypt
from datetime import datetime, timedelta
import logging
import sys
import traceback
import os
from sqlalchemy import Case, desc

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, 
     resources={
         r"/api/*": {
             "origins": os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(','),
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "expose_headers": ["Content-Range", "X-Content-Range"]
         }
     })

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                verify_jwt_in_request()
                user_id = get_jwt_identity()
                user = User.query.get(user_id)
                if not user or not user.is_admin:
                    return jsonify({"error": "Admin privileges required"}), 403
                return fn(*args, **kwargs)
            except Exception as e:
                logger.error(f"Admin authorization error: {str(e)}")
                return jsonify({"error": "Invalid or expired token"}), 422
        return decorator
    return wrapper

@app.after_request
def after_request(response):
    allowed_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    origin = request.headers.get('Origin')
    if origin in allowed_origins:
        response.headers.add('Access-Control-Allow-Origin', origin)
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

jwt = JWTManager(app)
db.init_app(app)

with app.app_context():
    try:
        logger.info("Creating database tables...")
        db.create_all()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        logger.error(traceback.format_exc())

@app.route('/api/login', methods=['POST'])
def login():
    logger.info("Processing login request")
    try:
        data = request.get_json()
        logger.debug(f"Login attempt for user: {data.get('username')}")
        
        user = User.query.filter_by(username=data['username']).first()
        if not user:
            logger.warning(f"Login failed: User {data.get('username')} not found")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
            access_token = create_access_token(identity=str(user.id))  # Convert user.id to string
            refresh_token = create_refresh_token(identity=str(user.id))  # Create refresh token
            logger.info(f"Login successful for user: {user.username}")
            return jsonify({
                'token': access_token,
                'refresh_token': refresh_token,
                'is_admin': user.is_admin,
                'username': user.username
            })
        
        logger.warning(f"Login failed: Invalid password for user {user.username}")
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/threat-level', methods=['GET'])
def get_threat_level():
    logger.info("Processing get threat level request")
    try:
        threat = ThreatLevel.query.order_by(ThreatLevel.updated_at.desc()).first()
        if not threat:
            logger.debug("No threat level found, returning default values")
            return jsonify({
                'level': 'Low',
                'description': 'No current threats',
                'updated_at': datetime.utcnow()
            })
        
        logger.debug(f"Retrieved threat level: {threat.level}")
        return jsonify({
            'level': threat.level,
            'description': threat.description,
            'updated_at': threat.updated_at
        })
    except Exception as e:
        logger.error(f"Error retrieving threat level: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error retrieving threat level'}), 500

@app.route('/api/threat-level', methods=['POST'])
@admin_required()
def update_threat_level():
    logger.info("Processing update threat level request")
    try:
        data = request.get_json()
        logger.debug(f"Received threat level update data: {data}")
        
        if not data:
            logger.error("No data provided in request")
            return jsonify({'error': 'No data provided'}), 400
            
        if 'level' not in data or 'description' not in data:
            logger.error("Missing required fields in request")
            return jsonify({'error': 'Level and description are required'}), 400

        new_threat = ThreatLevel(
            level=data['level'],
            description=data['description'],
            updated_at=datetime.utcnow()
        )
        
        logger.debug("Adding new threat level to database")
        db.session.add(new_threat)
        db.session.commit()
        logger.info(f"Threat level updated successfully to: {data['level']}")
        
        return jsonify({
            'message': 'Threat level updated successfully',
            'data': {
                'level': new_threat.level,
                'description': new_threat.description,
                'updated_at': new_threat.updated_at
            }
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating threat level: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/maturity-rating', methods=['GET'])
def get_maturity_rating():
    logger.info("Processing get maturity rating request")
    try:
        rating = MaturityRating.query.order_by(MaturityRating.updated_at.desc()).first()
        if not rating:
            logger.debug("No maturity rating found, returning default values")
            return jsonify({
                'score': 1.0,
                'trend': 'Stable',
                'updated_at': datetime.utcnow()
            })
        
        logger.debug(f"Retrieved maturity rating: {rating.score}")
        return jsonify({
            'score': rating.score,
            'trend': rating.trend,
            'updated_at': rating.updated_at
        })
    except Exception as e:
        logger.error(f"Error retrieving maturity rating: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error retrieving maturity rating'}), 500
    
@app.route('/api/refresh-token', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    try:
        current_user = get_jwt_identity()
        new_token = create_access_token(identity=current_user)
        return jsonify({'token': new_token}), 200
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}")
        return jsonify({'error': 'Token refresh failed'}), 401

@app.route('/api/maturity-rating', methods=['POST'])
@admin_required()
def update_maturity_rating():
    logger.info("Processing update maturity rating request")
    try:
        data = request.get_json()
        logger.debug(f"Received maturity rating update data: {data}")
        
        if not data:
            logger.error("No data provided in request")
            return jsonify({'error': 'No data provided'}), 400
            
        if 'score' not in data or 'trend' not in data:
            logger.error("Missing required fields in request")
            return jsonify({'error': 'Score and trend are required'}), 400

        try:
            score = float(data['score'])
            if not 0 <= score <= 5:
                return jsonify({'error': 'Score must be between 0 and 5'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid score value'}), 400

        new_rating = MaturityRating(
            score=score,
            trend=data['trend'],
            updated_at=datetime.utcnow()
        )
        
        logger.debug("Adding new maturity rating to database")
        db.session.add(new_rating)
        db.session.commit()
        logger.info(f"Maturity rating updated successfully to: {data['score']}")
        
        return jsonify({
            'message': 'Maturity rating updated successfully',
            'data': {
                'score': new_rating.score,
                'trend': new_rating.trend,
                'updated_at': new_rating.updated_at
            }
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating maturity rating: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

# Risk Management Routes
@app.route('/api/risks', methods=['GET'])
def get_risks():
    logger.info("Processing get risks request")
    try:
        risks = Risk.query.order_by(
            Case(
                (Risk.severity == 'Critical', 1),
                (Risk.severity == 'High', 2),
                (Risk.severity == 'Medium', 3),
                (Risk.severity == 'Low', 4)
            ),
            Risk.updated_at.desc()
        ).all()
        
        logger.debug(f"Retrieved {len(risks)} risks")
        return jsonify([risk.to_dict() for risk in risks])
    except Exception as e:
        logger.error(f"Error retrieving risks: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error retrieving risks'}), 500

@app.route('/api/risks', methods=['POST'])
@admin_required()
def create_risk():
    logger.info("Processing create risk request")
    try:
        data = request.get_json()
        logger.debug(f"Received risk creation data: {data}")
        
        required_fields = ['title', 'severity', 'status']
        if not all(field in data for field in required_fields):
            logger.error("Missing required fields in request")
            return jsonify({'error': 'Title, severity, and status are required'}), 400
            
        if data['severity'] not in ['Low', 'Medium', 'High', 'Critical']:
            return jsonify({'error': 'Invalid severity level'}), 400
            
        if data['status'] not in ['Open', 'In Progress', 'Closed']:
            return jsonify({'error': 'Invalid status'}), 400

        new_risk = Risk(
            title=data['title'],
            description=data.get('description', ''),
            severity=data['severity'],
            status=data['status'],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        logger.debug("Adding new risk to database")
        db.session.add(new_risk)
        db.session.commit()
        logger.info(f"Risk created successfully: {new_risk.title}")
        
        return jsonify({
            'message': 'Risk created successfully',
            'data': new_risk.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating risk: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error creating risk'}), 500

@app.route('/api/risks/<int:risk_id>', methods=['PUT'])
@admin_required()
def update_risk(risk_id):
    logger.info(f"Processing update risk request for risk_id: {risk_id}")
    try:
        risk = Risk.query.get(risk_id)
        if not risk:
            return jsonify({'error': 'Risk not found'}), 404

        data = request.get_json()
        logger.debug(f"Received risk update data: {data}")

        if 'severity' in data and data['severity'] not in ['Low', 'Medium', 'High', 'Critical']:
            return jsonify({'error': 'Invalid severity level'}), 400
            
        if 'status' in data and data['status'] not in ['Open', 'In Progress', 'Closed']:
            return jsonify({'error': 'Invalid status'}), 400

        # Update fields if they exist in the request
        if 'title' in data:
            risk.title = data['title']
        if 'description' in data:
            risk.description = data['description']
        if 'severity' in data:
            risk.severity = data['severity']
        if 'status' in data:
            risk.status = data['status']

        risk.updated_at = datetime.utcnow()
        db.session.commit()
        logger.info(f"Risk updated successfully: {risk.title}")

        return jsonify({
            'message': 'Risk updated successfully',
            'data': risk.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating risk: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error updating risk'}), 500

@app.route('/api/risks/<int:risk_id>', methods=['DELETE'])
@admin_required()
def delete_risk(risk_id):
    logger.info(f"Processing delete risk request for risk_id: {risk_id}")
    try:
        risk = Risk.query.get(risk_id)
        if not risk:
            return jsonify({'error': 'Risk not found'}), 404

        db.session.delete(risk)
        db.session.commit()
        logger.info(f"Risk deleted successfully: {risk.title}")

        return jsonify({
            'message': 'Risk deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting risk: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error deleting risk'}), 500
    
# Project Management Routes
@app.route('/api/projects', methods=['GET'])
def get_projects():
    logger.info("Processing get projects request")
    try:
        projects = Project.query.order_by(Project.due_date.asc()).all()
        logger.debug(f"Retrieved {len(projects)} projects")
        return jsonify([project.to_dict() for project in projects])
    except Exception as e:
        logger.error(f"Error retrieving projects: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error retrieving projects'}), 500

@app.route('/api/projects', methods=['POST'])
@admin_required()
def create_project():
    logger.info("Processing create project request")
    try:
        data = request.get_json()
        logger.debug(f"Received project creation data: {data}")
        
        required_fields = ['name', 'status', 'completion_percentage']
        if not all(field in data for field in required_fields):
            logger.error("Missing required fields in request")
            return jsonify({'error': 'Name, status, and completion percentage are required'}), 400
            
        valid_statuses = ['Not Started', 'In Progress', 'Completed', 'On Hold']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Status must be one of: {", ".join(valid_statuses)}'}), 400
            
        if not (0 <= float(data['completion_percentage']) <= 100):
            return jsonify({'error': 'Completion percentage must be between 0 and 100'}), 400

        new_project = Project(
            name=data['name'],
            description=data.get('description', ''),
            status=data['status'],
            completion_percentage=float(data['completion_percentage']),
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d') if 'start_date' in data else datetime.utcnow(),
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%d') if 'due_date' in data else None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        logger.debug("Adding new project to database")
        db.session.add(new_project)
        db.session.commit()
        logger.info(f"Project created successfully: {new_project.name}")
        
        return jsonify({
            'message': 'Project created successfully',
            'data': new_project.to_dict()
        }), 201

    except ValueError as ve:
        db.session.rollback()
        logger.error(f"Validation error creating project: {str(ve)}")
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating project: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error creating project'}), 500

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
@admin_required()
def update_project(project_id):
    logger.info(f"Processing update project request for project_id: {project_id}")
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        data = request.get_json()
        logger.debug(f"Received project update data: {data}")

        valid_statuses = ['Not Started', 'In Progress', 'Completed', 'On Hold']
        if 'status' in data and data['status'] not in valid_statuses:
            return jsonify({'error': f'Status must be one of: {", ".join(valid_statuses)}'}), 400
            
        if 'completion_percentage' in data and not (0 <= float(data['completion_percentage']) <= 100):
            return jsonify({'error': 'Completion percentage must be between 0 and 100'}), 400

        # Update fields if they exist in the request
        if 'name' in data:
            project.name = data['name']
        if 'description' in data:
            project.description = data['description']
        if 'status' in data:
            project.status = data['status']
        if 'completion_percentage' in data:
            project.completion_percentage = float(data['completion_percentage'])
        if 'due_date' in data:
            project.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d')
        if 'start_date' in data:
            project.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d')

        project.updated_at = datetime.utcnow()
        db.session.commit()
        logger.info(f"Project updated successfully: {project.name}")

        return jsonify({
            'message': 'Project updated successfully',
            'data': project.to_dict()
        })

    except ValueError as ve:
        db.session.rollback()
        logger.error(f"Validation error updating project: {str(ve)}")
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating project: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error updating project'}), 500

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
@admin_required()
def delete_project(project_id):
    logger.info(f"Processing delete project request for project_id: {project_id}")
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        db.session.delete(project)
        db.session.commit()
        logger.info(f"Project deleted successfully: {project.name}")

        return jsonify({
            'message': 'Project deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting project: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error deleting project'}), 500

# Add analytics endpoint for project statistics
@app.route('/api/projects/stats', methods=['GET'])
def get_project_stats():
    logger.info("Processing get project statistics request")
    try:
        total_projects = Project.query.count()
        completed_projects = Project.query.filter_by(status='Completed').count()
        in_progress_projects = Project.query.filter_by(status='In Progress').count()
        overdue_projects = Project.query.filter(
            Project.due_date < datetime.utcnow(),
            Project.status != 'Completed'
        ).count()

        return jsonify({
            'total_projects': total_projects,
            'completed_projects': completed_projects,
            'in_progress_projects': in_progress_projects,
            'overdue_projects': overdue_projects,
            'completion_rate': (completed_projects / total_projects * 100) if total_projects > 0 else 0
        })

    except Exception as e:
        logger.error(f"Error retrieving project statistics: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error retrieving project statistics'}), 500
    
# Compliance Framework Routes
@app.route('/api/compliance', methods=['GET'])
def get_compliance_frameworks():
    logger.info("Processing get compliance frameworks request")
    try:
        frameworks = ComplianceFramework.query.order_by(
            ComplianceFramework.current_score.desc()
        ).all()
        logger.debug(f"Retrieved {len(frameworks)} compliance frameworks")
        return jsonify([framework.to_dict() for framework in frameworks])
    except Exception as e:
        logger.error(f"Error retrieving compliance frameworks: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error retrieving compliance frameworks'}), 500

@app.route('/api/compliance', methods=['POST'])
@admin_required()
def create_compliance_framework():
    logger.info("Processing create compliance framework request")
    try:
        data = request.get_json()
        logger.debug(f"Received compliance framework creation data: {data}")
        
        required_fields = ['name', 'current_score', 'target_score', 'last_assessment_date']
        if not all(field in data for field in required_fields):
            logger.error("Missing required fields in request")
            return jsonify({
                'error': 'Name, current score, target score, and last assessment date are required'
            }), 400
            
        # Validate scores
        if not (0 <= float(data['current_score']) <= 100):
            return jsonify({'error': 'Current score must be between 0 and 100'}), 400
        if not (0 <= float(data['target_score']) <= 100):
            return jsonify({'error': 'Target score must be between 0 and 100'}), 400

        # Calculate next assessment date (default: 3 months from last assessment)
        last_assessment = datetime.strptime(data['last_assessment_date'], '%Y-%m-%d')
        next_assessment = last_assessment + timedelta(days=90)

        new_framework = ComplianceFramework(
            name=data['name'],
            current_score=float(data['current_score']),
            target_score=float(data['target_score']),
            last_assessment_date=last_assessment,
            next_assessment_date=next_assessment,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        logger.debug("Adding new compliance framework to database")
        db.session.add(new_framework)
        db.session.commit()
        logger.info(f"Compliance framework created successfully: {new_framework.name}")
        
        return jsonify({
            'message': 'Compliance framework created successfully',
            'data': new_framework.to_dict()
        }), 201

    except ValueError as ve:
        db.session.rollback()
        logger.error(f"Validation error creating compliance framework: {str(ve)}")
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating compliance framework: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error creating compliance framework'}), 500

@app.route('/api/compliance/<int:framework_id>', methods=['PUT'])
@admin_required()
def update_compliance_framework(framework_id):
    logger.info(f"Processing update compliance framework request for framework_id: {framework_id}")
    try:
        framework = ComplianceFramework.query.get(framework_id)
        if not framework:
            return jsonify({'error': 'Compliance framework not found'}), 404

        data = request.get_json()
        logger.debug(f"Received compliance framework update data: {data}")

        # Validate scores if provided
        if 'current_score' in data and not (0 <= float(data['current_score']) <= 100):
            return jsonify({'error': 'Current score must be between 0 and 100'}), 400
        if 'target_score' in data and not (0 <= float(data['target_score']) <= 100):
            return jsonify({'error': 'Target score must be between 0 and 100'}), 400

        # Update fields if they exist in the request
        if 'name' in data:
            framework.name = data['name']
        if 'current_score' in data:
            framework.current_score = float(data['current_score'])
        if 'target_score' in data:
            framework.target_score = float(data['target_score'])
        if 'last_assessment_date' in data:
            framework.last_assessment_date = datetime.strptime(data['last_assessment_date'], '%Y-%m-%d')
            framework.next_assessment_date = framework.last_assessment_date + timedelta(days=90)

        framework.updated_at = datetime.utcnow()
        db.session.commit()
        logger.info(f"Compliance framework updated successfully: {framework.name}")

        return jsonify({
            'message': 'Compliance framework updated successfully',
            'data': framework.to_dict()
        })

    except ValueError as ve:
        db.session.rollback()
        logger.error(f"Validation error updating compliance framework: {str(ve)}")
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating compliance framework: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error updating compliance framework'}), 500

@app.route('/api/compliance/<int:framework_id>', methods=['DELETE'])
@admin_required()
def delete_compliance_framework(framework_id):
    logger.info(f"Processing delete compliance framework request for framework_id: {framework_id}")
    try:
        framework = ComplianceFramework.query.get(framework_id)
        if not framework:
            return jsonify({'error': 'Compliance framework not found'}), 404

        db.session.delete(framework)
        db.session.commit()
        logger.info(f"Compliance framework deleted successfully: {framework.name}")

        return jsonify({
            'message': 'Compliance framework deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting compliance framework: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error deleting compliance framework'}), 500

@app.route('/api/compliance/stats', methods=['GET'])
def get_compliance_stats():
    logger.info("Processing get compliance statistics request")
    try:
        frameworks = ComplianceFramework.query.all()
        total_frameworks = len(frameworks)
        
        if total_frameworks == 0:
            return jsonify({
                'average_score': 0,
                'frameworks_meeting_target': 0,
                'frameworks_below_target': 0,
                'overall_compliance_status': 'No frameworks defined'
            })

        total_score = sum(f.current_score for f in frameworks)
        average_score = total_score / total_frameworks
        frameworks_meeting_target = sum(1 for f in frameworks if f.current_score >= f.target_score)
        frameworks_below_target = total_frameworks - frameworks_meeting_target

        # Calculate overall compliance status
        if average_score >= 90:
            status = 'Excellent'
        elif average_score >= 75:
            status = 'Good'
        elif average_score >= 60:
            status = 'Fair'
        else:
            status = 'Needs Improvement'

        return jsonify({
            'average_score': round(average_score, 2),
            'frameworks_meeting_target': frameworks_meeting_target,
            'frameworks_below_target': frameworks_below_target,
            'overall_compliance_status': status,
            'upcoming_assessments': sum(1 for f in frameworks if f.next_assessment_date <= datetime.utcnow() + timedelta(days=30))
        })

    except Exception as e:
        logger.error(f"Error retrieving compliance statistics: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error retrieving compliance statistics'}), 500

# Utility function for date validation
def validate_date_format(date_string):
    try:
        return datetime.strptime(date_string, '%Y-%m-%d')
    except ValueError:
        raise ValueError('Invalid date format. Use YYYY-MM-DD')

# Error handlers for common scenarios
@app.errorhandler(400)
def bad_request_error(error):
    logger.warning(f"400 error: {str(error)}")
    return jsonify({'error': str(error)}), 400

@app.errorhandler(401)
def unauthorized_error(error):
    logger.warning(f"401 error: {str(error)}")
    return jsonify({'error': 'Unauthorized access'}), 401

@app.errorhandler(403)
def forbidden_error(error):
    logger.warning(f"403 error: {str(error)}")
    return jsonify({'error': 'Forbidden access'}), 403

@app.errorhandler(404)
def not_found_error(error):
    logger.warning(f"404 error: {request.url}")
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 error: {str(error)}")
    logger.error(traceback.format_exc())
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/maturity-trend', methods=['GET'])
def get_maturity_trend():
    try:
        points = MaturityTrendPoint.query.order_by(MaturityTrendPoint.month).all()
        return jsonify([point.to_dict() for point in points])
    except Exception as e:
        logger.error(f"Error retrieving maturity trend: {str(e)}")
        return jsonify({'error': 'Error retrieving maturity trend'}), 500

@app.route('/api/maturity-trend', methods=['POST'])
@admin_required()
def add_maturity_trend_point():
    try:
        data = request.get_json()
        if not data or 'month' not in data or 'score' not in data:
            return jsonify({'error': 'Month and score are required'}), 400

        # Check if point already exists for this month
        existing_point = MaturityTrendPoint.query.filter_by(month=data['month']).first()
        if existing_point:
            existing_point.score = float(data['score'])
            db.session.commit()
        else:
            new_point = MaturityTrendPoint(
                month=data['month'],
                score=float(data['score'])
            )
            db.session.add(new_point)
            db.session.commit()

        return jsonify({'message': 'Maturity trend point added successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding maturity trend point: {str(e)}")
        return jsonify({'error': 'Error adding maturity trend point'}), 500

@app.route('/api/maturity-trend/<string:month>', methods=['DELETE'])
@admin_required()
def delete_maturity_trend_point(month):
    try:
        point = MaturityTrendPoint.query.filter_by(month=month).first()
        if not point:
            return jsonify({'error': 'Point not found'}), 404

        db.session.delete(point)
        db.session.commit()
        return jsonify({'message': 'Maturity trend point deleted successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting maturity trend point: {str(e)}")
        return jsonify({'error': 'Error deleting maturity trend point'}), 500

# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'error': 'Token has expired',
        'code': 'token_expired'
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'error': 'Invalid token',
        'code': 'invalid_token'
    }), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'error': 'Authorization token is missing',
        'code': 'authorization_required'
    }), 401

@app.errorhandler(404)
def not_found_error(error):
    logger.warning(f"404 error: {request.url}")
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 error: {str(error)}")
    logger.error(traceback.format_exc())
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info("Starting Flask application")
    app.run(debug=True, host='0.0.0.0')