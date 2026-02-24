# CareLine360-WebApp-MERN
Health helpline - A web application for remote consultation &amp; emergency help in remote regions.


<!-- Login -->
http://localhost:5000/api/auth/login
{
  "identifier":"kyalini2001@gmail.com",
  "password": "Vanai@2001"
}

<!-- Register -->
{
  "role": "patient",
  "fullname": "Vanaiyalini",
  "identifier":"kyalini2001@gmail.com",
  "password": "Vanai@2001"
}
<!-- Patient ID -->
GET
http://localhost:5000/api/patients/me

<!-- Get medical history -->
http://localhost:5000/api/patients/me/medical-history

<!-- AI chat -->
POST
http://localhost:5000/api/patients/me/ai-explain

{
  "text": "Diagnosis: Hypertension. Medicine: Amlodipine 5mg once daily."
}