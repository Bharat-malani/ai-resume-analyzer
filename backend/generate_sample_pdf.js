const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const outputPath = path.join(uploadsDir, 'sample_alex_morgan_resume.pdf');
const doc = new PDFDocument({ margin: 40 });

doc.pipe(fs.createWriteStream(outputPath));

// Header
doc.fontSize(20).font('Helvetica-Bold').text('Alex Morgan', { align: 'center' });
doc.fontSize(10).font('Helvetica').text('alex.morgan@email.com | +1 (555) 234-5678 | San Francisco, CA', { align: 'center' });
doc.fontSize(9).font('Helvetica').text('linkedin.com/in/alexmorgan-dev | github.com/alexmorgan-dev', { align: 'center' });
doc.moveDown(1.5);

// Professional Summary
doc.fontSize(12).font('Helvetica-Bold').text('Professional Summary');
doc.rect(40, doc.y, 520, 1).fill('#cbd5e1');
doc.moveDown(0.5);
doc.fontSize(10).font('Helvetica').fillColor('#1e293b').text(
  'Versatile Full Stack Software Engineer with practical expertise in building responsive web applications and RESTful microservices. Proficient in React, JavaScript, TypeScript, Node.js, and PostgreSQL. Proven track record in developing scalable APIs and collaborating in agile environments.'
);
doc.moveDown(1.2);

// Technical Skills
doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Technical Skills');
doc.rect(40, doc.y, 520, 1).fill('#cbd5e1');
doc.moveDown(0.5);
doc.fontSize(10).font('Helvetica').fillColor('#1e293b');
doc.text('• Programming Languages: JavaScript, TypeScript, Python, SQL, HTML5, CSS3');
doc.text('• Frontend Development: React, Redux, Tailwind CSS, Responsive Design, Vite');
doc.text('• Backend & APIs: Node.js, Express.js, REST API, Microservices');
doc.text('• Databases & Storage: PostgreSQL, MongoDB, Redis');
doc.text('• DevOps & Tools: Git, GitHub, Docker, Postman, Linux CLI, CI/CD');
doc.moveDown(1.2);

// Work Experience
doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Work Experience');
doc.rect(40, doc.y, 520, 1).fill('#cbd5e1');
doc.moveDown(0.5);

doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('Software Engineering Intern — CloudScale Technologies (2023 - Present)');
doc.fontSize(10).font('Helvetica').fillColor('#334155');
doc.text('• Engineered scalable REST API endpoints utilizing Node.js and Express.js, handling 15,000 daily requests.');
doc.text('• Developed dynamic and responsive user interface components using React and Tailwind CSS.');
doc.text('• Optimized database queries in PostgreSQL, improving query response latency by 25%.');
doc.text('• Collaborated with senior engineers using Git version control and GitHub pull request reviews in Agile sprints.');
doc.moveDown(1.2);

// Projects
doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Key Projects');
doc.rect(40, doc.y, 520, 1).fill('#cbd5e1');
doc.moveDown(0.5);

doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('AI Task & Workflow Automation System');
doc.fontSize(10).font('Helvetica').fillColor('#334155');
doc.text('• Architected full-stack productivity web application using React, Node.js, and PostgreSQL.');
doc.text('• Implemented secure JWT authentication and bcrypt password hashing for multi-user access.');
doc.text('• Containerized frontend and backend services using Docker for standardized development deployment.');
doc.moveDown(0.8);

doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('E-Commerce Analytics Dashboard');
doc.fontSize(10).font('Helvetica').fillColor('#334155');
doc.text('• Built responsive analytics dashboard leveraging React and Recharts data visualization library.');
doc.text('• Integrated third-party payment and order tracking APIs with real-time error handling.');
doc.moveDown(1.2);

// Education
doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Education');
doc.rect(40, doc.y, 520, 1).fill('#cbd5e1');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('Bachelor of Science in Computer Science (B.Sc. CS)');
doc.fontSize(10).font('Helvetica').fillColor('#334155').text('State University of Technology (2020 - 2024) — GPA: 3.8/4.0');

doc.end();
console.log('[Generate Sample PDF] Successfully created sample PDF resume at:', outputPath);
