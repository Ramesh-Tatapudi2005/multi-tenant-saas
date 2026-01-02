# backend/app/seed.py
from . import models, auth, database
from .database import engine

def seed_data():
    # Force table creation to avoid "Relation does not exist"
    models.Base.metadata.create_all(bind=engine)
    db = next(database.get_db())
    
    try:
        # Wipe old data to ensure a clean start
        db.query(models.AuditLog).delete()
        db.query(models.User).delete()
        db.commit()

        # Seed Super Admin
        db.add(models.User(
            id=1, 
            email="superadmin@system.com",
            password_hash=auth.get_password_hash("admin123"), #
            role="super_admin",
            tenant_id="system"
        ))

        # Seed Tenant Admin
        db.add(models.User(
            id=2, 
            email="admin@demo.com",
            password_hash=auth.get_password_hash("password123"), #
            role="tenant_admin",
            tenant_id="demo-tenant-id"
        ))

        db.commit()
        print("✅ Database Seeded! Use: admin@demo.com / password123")
    except Exception as e:
        print(f"❌ Seed failed: {e}")
        db.rollback()

if __name__ == "__main__":
    seed_data()