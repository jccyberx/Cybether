from app import app, db
from models.models import ThreatLevel, MaturityRating, Risk, Project, ComplianceFramework
from datetime import datetime, timedelta

def seed_mock_data():
    with app.app_context():
        # Clear existing data
        db.session.query(ThreatLevel).delete()
        db.session.query(MaturityRating).delete()
        db.session.query(Risk).delete()
        db.session.query(Project).delete()
        db.session.query(ComplianceFramework).delete()

        # Add Threat Level
        threat = ThreatLevel(level='Medium', description='Current threat level is medium due to increased phishing attempts')
        db.session.add(threat)

        # Add Maturity Rating
        maturity = MaturityRating(score=4.0, trend='Increasing')
        db.session.add(maturity)

        # Add Risks
        risks = [
            Risk(title='Unpatched Systems', description='Critical systems requiring security updates', severity='High', status='Open'),
            Risk(title='Weak Passwords', description='Users using simple passwords', severity='Medium', status='In Progress'),
            Risk(title='Data Leakage', description='Potential data exposure through cloud services', severity='Critical', status='Open'),
        ]
        for risk in risks:
            db.session.add(risk)

        # Add Projects
        projects = [
            Project(name='Zero Trust Implementation', description='Implementing zero trust architecture', status='In Progress', completion_percentage=65),
            Project(name='Security Awareness Training', description='Employee security training program', status='In Progress', completion_percentage=80),
        ]
        for project in projects:
            db.session.add(project)

        # Add Compliance Frameworks
        frameworks = [
            ComplianceFramework(name='PCI DSS', current_score=85, target_score=100, last_assessment_date=datetime.now() - timedelta(days=30)),
            ComplianceFramework(name='NIST CSF', current_score=78, target_score=95, last_assessment_date=datetime.now() - timedelta(days=45)),
            ComplianceFramework(name='ISO 27001', current_score=82, target_score=100, last_assessment_date=datetime.now() - timedelta(days=60)),
            ComplianceFramework(name='SOC 2', current_score=90, target_score=100, last_assessment_date=datetime.now() - timedelta(days=15)),
        ]
        for framework in frameworks:
            db.session.add(framework)

        db.session.commit()

if __name__ == '__main__':
    seed_mock_data()