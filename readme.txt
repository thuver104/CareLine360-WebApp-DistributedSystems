CareLine360 Deployment Guide (SE3020 Assignment 1)

Architecture mode: Microservices only (monolith removed).

1. Prerequisites
- Node.js 18+
- npm 9+
- Docker Desktop
- Kubernetes cluster (optional: minikube / Docker Desktop K8s)

2. Clone and install frontend
- git clone https://github.com/thuver104/CareLine360-WebApp-DistributedSystems.git
- cd client
- npm install

3. Configure environment variables
- Create server/.env for shared runtime values used by containers:
  JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CLIENT_URL,
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM,
  SMSLENZ_USER_ID, SMSLENZ_API_KEY, SMSLENZ_SENDER_ID,
  PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET,
  JITSI_DOMAIN, JITSI_PREFIX

- Create client/.env:
  VITE_API_URL
  VITE_SOCKET_URL (optional; keep empty unless a socket backend is running)

4. Build microservice images
- docker build -t careline360/auth-service:latest -f server/services/auth-service/Dockerfile server/services
- docker build -t careline360/patient-service:latest server/services/patient-service
- docker build -t careline360/doctor-service:latest server/services/doctor-service
- docker build -t careline360/appointment-service:latest server/services/appointment-service
- docker build -t careline360/admin-service:latest server/services/admin-service
- docker build -t careline360/emergency-service:latest server/services/emergency-service
- docker build -t careline360/api-gateway:latest server/services/api-gateway

5. Run services locally (Docker)
- Easiest way (recommended):
  powershell -ExecutionPolicy Bypass -File scripts/start-containers.ps1
- Stop all app containers:
  powershell -ExecutionPolicy Bypass -File scripts/stop-containers.ps1

Manual alternative:
- Create network:
  docker network create careline-net
- Start infra:
  docker run -d --name careline-mongo --network careline-net -p 27017:27017 mongo:7
  docker run -d --name careline-rabbit --network careline-net -p 5672:5672 -p 15672:15672 rabbitmq:3-management
- Start service containers with --env-file server/.env and service-specific PORT/MONGO_URI.

6. Service endpoints
- api-gateway:        http://localhost:1111/health
- auth-service:        http://localhost:3001/health
- patient-service:     http://localhost:5002/health/ready
- doctor-service:      http://localhost:5003/health
- appointment-service: http://localhost:5004/health
- admin-service:       http://localhost:5005/health
- emergency-service:   http://localhost:5006/health

7. Frontend run
- cd client
- npm run dev



9. Verify deployment
- kubectl get pods -n careline360
- kubectl get svc -n careline360
- kubectl get ingress -n careline360

10. Submission packaging
- Include: source code, submission.txt, readme.txt, members.txt, report.pdf
- Zip name format: GroupID_DS-Assignment.zip

















--- No need to run8. Kubernetes deployment
- kubectl apply -f k8s/base/namespace.yaml
- kubectl apply -f k8s/base/configmap/app-config.yaml
- kubectl apply -f k8s/base/secrets/app-secrets.example.yaml
- kubectl apply -f k8s/base/services/
- kubectl apply -f k8s/base/ingress/