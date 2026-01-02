# backend/app/seed.py
from . import models, auth, database
from .database import engine

def seed_data():
    # 1. Force table creation to build the schema first
    models.Base.metadata.create_all(bind=engine)
    db = next(database.get_db())
    
    try:
        print("⏳ Starting database seeding...")
        
        # 2. Wipe old data for a clean start (Order matters due to Foreign Keys)
        # We delete child records first to avoid constraint violations
        db.query(models.AuditLog).delete()
        db.query(models.Task).delete()
        db.query(models.Project).delete()
        db.query(models.User).delete()
        db.query(models.Tenant).delete()
        db.commit()

        # 3. Seed Mandatory Super Admin (tenant_id MUST be NULL)
        super_admin = models.User(
            email="superadmin@system.com",
            password_hash=auth.get_password_hash("Admin@123"), # Matches submission.json
            full_name="System Super Admin",
            role="super_admin",
            tenant_id=None # REQUIRED: Super admins do not belong to a tenant
        )
        db.add(super_admin)

        # 4. Seed Mandatory Demo Tenant
        demo_tenant = models.Tenant(
            name="Demo Company",
            subdomain="demo", # Used for login and subdomain identification
            status="active",
            subscription_plan="pro",
            max_users=25,
            max_projects=15
        )
        db.add(demo_tenant)
        db.commit() # Commit to generate the tenant ID for foreign keys
        db.refresh(demo_tenant)

        # 5. Seed Mandatory Tenant Admin for Demo Company
        tenant_admin = models.User(
            email="admin@demo.com",
            password_hash=auth.get_password_hash("Demo@123"), # Matches submission.json
            full_name="Demo Administrator",
            role="tenant_admin",
            tenant_id=demo_tenant.id
        )
        db.add(tenant_admin)

        # 6. Seed a Regular User for the Demo Company
        regular_user = models.User(
            email="user1@demo.com",
            password_hash=auth.get_password_hash("User@123"),
            full_name="John Doe",
            role="user",
            tenant_id=demo_tenant.id
        )
        db.add(regular_user)
        db.commit()
        db.refresh(tenant_admin)

        # 7. Seed Sample Project for Demo Company
        demo_project = models.Project(
            name="SaaS Platform Launch",
            description="Preparation and marketing for the new platform launch",
            status="active",
            tenant_id=demo_tenant.id,
            created_by=tenant_admin.id
        )
        db.add(demo_project)
        db.commit()
        db.refresh(demo_project)

        # 8. Seed Sample Task assigned to the regular user
        db.add(models.Task(
            title="Design Frontend Dashboard",
            description="Create responsive mockup using Tailwind CSS",
            status="todo",
            priority="high",
            project_id=demo_project.id,
            tenant_id=demo_tenant.id, # Must match project tenant
            assigned_to=regular_user.id
        ))

        db.commit()
        print("✅ Database Seeded Successfully!")
        print("--------------------------------------")
        print(f"Super Admin:  superadmin@system.com / Admin@123")
        print(f"Tenant Admin: admin@demo.com      / Demo@123 (Subdomain: demo)")
        print(f"Regular User: user1@demo.com      / User@123")
        print("--------------------------------------")
        
    except Exception as e:
        print(f"❌ Seed failed: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()