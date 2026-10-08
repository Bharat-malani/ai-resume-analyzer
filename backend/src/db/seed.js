const bcrypt = require('bcryptjs');
const db = require('./index');

async function seed() {
  console.log('[Seed] Initializing database seed data...');
  await db.initDb();

  // 1. Seed Users (Demo & Admin)
  const salt = await bcrypt.genSalt(10);
  const userPasswordHash = await bcrypt.hash('demo1234', salt);
  const adminPasswordHash = await bcrypt.hash('admin1234', salt);

  let demoUser = await db.users.findByEmail('demo@resumeai.io');
  if (!demoUser) {
    demoUser = await db.users.create({
      name: 'Alex Morgan',
      email: 'demo@resumeai.io',
      password_hash: userPasswordHash,
      role: 'USER'
    });
    console.log('[Seed] Created demo user: demo@resumeai.io / demo1234');
  }

  let adminUser = await db.users.findByEmail('admin@resumeai.io');
  if (!adminUser) {
    adminUser = await db.users.create({
      name: 'Dr. System Administrator',
      email: 'admin@resumeai.io',
      password_hash: adminPasswordHash,
      role: 'ADMIN'
    });
    console.log('[Seed] Created admin user: admin@resumeai.io / admin1234');
  }

  // 2. Seed Sample Job Postings
  const sampleJobs = [
    {
      title: 'Full Stack Software Engineer',
      company: 'TechFlow Systems',
      description_text: 'Looking for a skilled Full Stack Software Engineer to build scalable web applications. Requirements: React, Node.js, Express.js, TypeScript, PostgreSQL, REST APIs, Git, Docker, and CI/CD pipelines. Strong problem-solving skills and clean architecture design required.',
      required_skills: ['React', 'Node.js', 'Express.js', 'TypeScript', 'PostgreSQL', 'REST API', 'Git', 'Docker', 'CI/CD']
    },
    {
      title: 'Java Backend Developer',
      company: 'Apex Cloud Solutions',
      description_text: 'Seeking an experienced Java Developer to develop enterprise microservices. Required: Java, Spring Boot, Hibernate, SQL, PostgreSQL, REST APIs, Docker, and Git. Familiarity with AWS and unit testing (JUnit) is a plus.',
      required_skills: ['Java', 'Spring Boot', 'Hibernate', 'SQL', 'PostgreSQL', 'REST API', 'Docker', 'Git', 'JUnit']
    },
    {
      title: 'Frontend Engineer (React)',
      company: 'ModernUI Labs',
      description_text: 'We are seeking a Frontend Engineer proficient in JavaScript, React, Tailwind CSS, HTML5, CSS3, Vite, and responsive design. Must have experience consuming REST APIs and writing modular, testable UI components.',
      required_skills: ['JavaScript', 'React', 'Tailwind CSS', 'HTML', 'CSS', 'Vite', 'REST API']
    }
  ];

  for (const job of sampleJobs) {
    const existingJobs = await db.jobs.listByUser(demoUser.id);
    if (!existingJobs.some(j => j.title === job.title)) {
      await db.jobs.create({
        user_id: demoUser.id,
        title: job.title,
        company: job.company,
        description_text: job.description_text,
        required_skills: job.required_skills
      });
      console.log(`[Seed] Created sample job: ${job.title}`);
    }
  }

  console.log('[Seed] Database seeding completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
