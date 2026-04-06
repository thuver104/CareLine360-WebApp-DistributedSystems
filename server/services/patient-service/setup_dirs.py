import os

base_path = r"c:\Users\thuve\Desktop\SLIIT\Y3S2\DS\CODE\CareLine360-WebApp-DistributedSystems\server\services\patient-service"

directories = [
    "src",
    "src/config",
    "src/models",
    "src/controllers",
    "src/services",
    "src/routes",
    "src/middleware",
    "src/consumers",
    "src/publishers",
    "src/validators",
    "src/utils",
    "logs",
    "tests"
]

os.chdir(base_path)
created_count = 0

for directory in directories:
    try:
        os.makedirs(directory, exist_ok=True)
        created_count += 1
        print(f"Created: {directory}/")
    except Exception as e:
        print(f"Error creating {directory}: {e}")

# Create .gitkeep in logs
with open("logs/.gitkeep", "w") as f:
    pass
print("Created: logs/.gitkeep")

print(f"\nSuccessfully created {created_count}/{len(directories)} directories")
