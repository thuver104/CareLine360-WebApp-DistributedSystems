CareLine360 Deployment Guide (SE3020 Assignment 1)

1. Prerequisites
- Node.js 18+
- npm 9+
- MongoDB (local or Atlas)
- Docker Desktop (for containerized/microservice setup)
- Kubernetes cluster (minikube, Docker Desktop K8s, or cloud K8s)

2. Clone and install dependencies
- Clone repository:
  git clone https://github.com/thuver104/CareLine360-WebApp-DistributedSystems.git
- Backend install:
  cd server
  npm install
- Frontend install:
  cd ../client
  npm install

3. Configure environment variables
- Create server/.env and configure:
  PORT, MONGO_URI, CLIENT_URL,
  JWT_ACCESS_SECRET, JWT_REFRESH_SECRET,
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM,
  SMSLENZ_USER_ID, SMSLENZ_API_KEY, SMSLENZ_SENDER_ID,
  PAYMENT_GATEWAY_MODE, PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET,
  PAYHERE_RETURN_URL, PAYHERE_CANCEL_URL, PAYHERE_NOTIFY_URL,
  JITSI_DOMAIN, JITSI_PREFIX

- Create client/.env and configure:
  VITE_API_URL

4. Run in local development mode
- Start backend:
  cd server
  npm run dev
- Start frontend:
  cd client
  npm run dev

5. Run tests
- Backend tests:
  cd server
  npm test

6. Dockerized microservices (available services)
- Dockerfiles are available for:
  server/services/auth-service
  server/services/patient-service
  server/services/doctor-service
  server/services/appointment-service

- Build each service image (example):
  docker build -t careline360/auth-service:latest server/services/auth-service

7. Kubernetes deployment
- Namespace and manifests are in k8s/base
- Apply manifests:
  kubectl apply -f k8s/base/namespace.yaml
  kubectl apply -f k8s/base/configmap/app-config.yaml
  kubectl apply -f k8s/base/secrets/app-secrets.example.yaml
  kubectl apply -f k8s/base/services/
  kubectl apply -f k8s/base/ingress/

8. Verify deployment
- kubectl get pods -n careline360
- kubectl get svc -n careline360
- kubectl get ingress -n careline360

9. Postman API validation
- Import postman/collections/CareLine360-APIDocs.postman_collection.json
- Import postman/environments/CareLine360_Local.postman_environment.json

10. Submission packaging
- Include: source code, submission.txt, readme.txt, members.txt, report.pdf
- Zip name format: GroupID_DS-Assignment.zip
