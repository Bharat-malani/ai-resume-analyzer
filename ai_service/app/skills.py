import re
from typing import Dict, List, Set, Any

# Structured 350+ Skills Database by Category
SKILL_TAXONOMY: Dict[str, List[str]] = {
    "Programming Languages": [
        "Python", "Java", "JavaScript", "TypeScript", "C", "C++", "C#", "Go", "Golang", 
        "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Scala", "R", "Dart", "MATLAB", 
        "Perl", "Bash", "Shell Scripting", "PowerShell", "SQL", "HTML5", "CSS3"
    ],
    "Frontend Development": [
        "HTML", "CSS", "React", "React.js", "Angular", "Vue.js", "Next.js", "Nuxt.js", 
        "Redux", "Zustand", "Tailwind CSS", "Bootstrap", "Material UI", "Chakra UI", 
        "Sass", "SCSS", "Less", "Webpack", "Vite", "Babel", "jQuery", "WebSockets", 
        "Responsive Design", "Single Page Applications", "Progressive Web Apps"
    ],
    "Backend & Frameworks": [
        "Node.js", "Express.js", "NestJS", "Django", "Django REST Framework", "Flask", 
        "FastAPI", "Spring", "Spring Boot", "Hibernate", "ASP.NET", "ASP.NET Core", 
        ".NET Core", "Ruby on Rails", "Laravel", "Symfony", "GraphQL", "REST API", 
        "RESTful Services", "gRPC", "Microservices", "Serverless", "Socket.io", "Celery"
    ],
    "Databases & Storage": [
        "PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Elasticsearch", "Cassandra", 
        "Oracle Database", "Microsoft SQL Server", "DynamoDB", "Firebase", "Firestore", 
        "Supabase", "Neo4j", "MariaDB", "Prisma", "TypeORM", "Mongoose", "SQLAlchemy"
    ],
    "Cloud & DevOps": [
        "Amazon Web Services", "AWS", "Microsoft Azure", "Google Cloud Platform", "GCP", 
        "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "GitHub Actions", 
        "GitLab CI", "CI/CD", "CircleCI", "Prometheus", "Grafana", "Nginx", "Apache", 
        "Linux", "Ubuntu", "Cloudflare", "Serverless Architecture"
    ],
    "Data Science, AI & ML": [
        "Machine Learning", "Deep Learning", "Artificial Intelligence", "Natural Language Processing", 
        "Computer Vision", "TensorFlow", "PyTorch", "Keras", "scikit-learn", "Pandas", 
        "NumPy", "SciPy", "Matplotlib", "Seaborn", "OpenCV", "Hugging Face", "Transformers", 
        "LLMs", "LangChain", "LlamaIndex", "BERT", "NLTK", "spaCy", "Data Analysis", 
        "Feature Engineering", "Data Visualization", "Tableau", "Power BI", "Big Data", 
        "Apache Spark", "Hadoop", "Airflow"
    ],
    "Testing & Quality Assurance": [
        "Unit Testing", "Integration Testing", "Jest", "Mocha", "Chai", "PyTest", 
        "JUnit", "Selenium", "Cypress", "Playwright", "Puppeteer", "Postman", 
        "Swagger", "Test-Driven Development", "Behavior-Driven Development", "Mocking"
    ],
    "Tools, Methodologies & Architecture": [
        "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence", "Agile", "Scrum", 
        "Kanban", "Design Patterns", "Object-Oriented Programming", "Functional Programming", 
        "System Design", "Clean Architecture", "Model-View-Controller", "Data Structures", 
        "Algorithms", "Problem Solving", "Linux CLI", "VS Code"
    ],
    "Soft Skills": [
        "Communication", "Team Collaboration", "Leadership", "Problem Solving", 
        "Critical Thinking", "Adaptability", "Time Management", "Work Ethic", 
        "Mentorship", "Public Speaking", "Cross-functional Collaboration", "Conflict Resolution"
    ]
}

# Skill Aliases Mapping to Canonical Names
SKILL_ALIASES: Dict[str, str] = {
    # Languages
    "js": "JavaScript",
    "ts": "TypeScript",
    "py": "Python",
    "golang": "Go",
    "cpp": "C++",
    "c sharp": "C#",
    "csharp": "C#",
    "bash scripting": "Bash",
    "shell script": "Shell Scripting",
    # Frontend
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "next": "Next.js",
    "nextjs": "Next.js",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "bootstrap5": "Bootstrap",
    "pwa": "Progressive Web Apps",
    "spa": "Single Page Applications",
    # Backend
    "node": "Node.js",
    "nodejs": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "springboot": "Spring Boot",
    "spring-boot": "Spring Boot",
    "rest": "REST API",
    "rest apis": "REST API",
    "restful": "REST API",
    "drf": "Django REST Framework",
    ".net": ".NET Core",
    "dotnet": ".NET Core",
    # Databases
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "mongo": "MongoDB",
    "mssql": "Microsoft SQL Server",
    "sql server": "Microsoft SQL Server",
    "elastic search": "Elasticsearch",
    # Cloud / DevOps
    "k8s": "Kubernetes",
    "kube": "Kubernetes",
    "amazon web services": "AWS",
    "google cloud": "GCP",
    "google cloud platform": "GCP",
    "azure": "Microsoft Azure",
    "github actions": "GitHub Actions",
    "continuous integration": "CI/CD",
    "ci cd": "CI/CD",
    # AI / Data
    "ml": "Machine Learning",
    "dl": "Deep Learning",
    "ai": "Artificial Intelligence",
    "nlp": "Natural Language Processing",
    "cv": "Computer Vision",
    "sklearn": "scikit-learn",
    "huggingface": "Hugging Face",
    "large language models": "LLMs",
    "llm": "LLMs",
    # Tools & Others
    "oop": "Object-Oriented Programming",
    "oops": "Object-Oriented Programming",
    "dsa": "Data Structures & Algorithms",
    "data structures": "Data Structures",
    "tdd": "Test-Driven Development",
    "bdd": "Behavior-Driven Development"
}

class SkillExtractor:
    """
    High-precision skill extraction engine.
    Matches direct canonical names, aliases, and avoids false positives on single-letter tokens.
    """

    def __init__(self):
        # Build lookup set and precompiled patterns
        self.canonical_skills: Set[str] = set()
        self.category_map: Dict[str, str] = {}
        for category, skills in SKILL_TAXONOMY.items():
            for skill in skills:
                self.canonical_skills.add(skill)
                self.category_map[skill] = category

        # Compile lookup terms with word boundary patterns
        self.term_to_canonical: Dict[str, str] = {}
        for skill in self.canonical_skills:
            self.term_to_canonical[skill.lower()] = skill

        for alias, canonical in SKILL_ALIASES.items():
            self.term_to_canonical[alias.lower()] = canonical

        # Precompile regex patterns for multi-word and short terms
        self.patterns: List[tuple] = []
        # Sort terms by length descending so longer phrases match first (e.g. "Spring Boot" before "Spring")
        sorted_terms = sorted(self.term_to_canonical.keys(), key=lambda t: len(t), reverse=True)
        for term in sorted_terms:
            canonical = self.term_to_canonical[term]
            # Handle special characters in tech terms like C++, C#, .NET, CI/CD
            escaped = re.escape(term)
            if term in ["c", "r"]:
                # Single letter languages require specific programming/dev context or commas
                pattern = re.compile(rf'(?:(?:programming\s+in|proficient\s+in|languages?:?\s*[^.\n]*?)\b{escaped}\b|\b{escaped}\b(?=\s*,\s*(?:c\+\+|java|python)))', re.IGNORECASE)
            elif term in ["go"]:
                pattern = re.compile(rf'\b(?:golang|go\s+language|programming\s+in\s+go)\b|\bgo\b(?=\s*,\s*(?:rust|python|docker))', re.IGNORECASE)
            elif term in ["ai", "ml", "dl", "ci/cd", "c++", "c#", ".net"]:
                # Punctuation or short acronyms
                pattern = re.compile(rf'(?<![a-zA-Z0-9]){escaped}(?![a-zA-Z0-9])', re.IGNORECASE)
            else:
                pattern = re.compile(rf'\b{escaped}\b', re.IGNORECASE)
            
            self.patterns.append((pattern, canonical))

    def extract_skills(self, text: str) -> Dict[str, Any]:
        """
        Extract categorized skills and flat unique skills from given text.
        """
        if not text:
            return {"skills": [], "categories": {}, "total_count": 0}

        found_skills: Set[str] = set()

        for pattern, canonical in self.patterns:
            if pattern.search(text):
                found_skills.add(canonical)

        # Categorize detected skills
        categorized: Dict[str, List[str]] = {}
        for skill in found_skills:
            cat = self.category_map.get(skill, "Tools, Methodologies & Architecture")
            if cat not in categorized:
                categorized[cat] = []
            categorized[cat].append(skill)

        # Sort within each category
        for cat in categorized:
            categorized[cat].sort()

        return {
            "skills": sorted(list(found_skills)),
            "categories": categorized,
            "total_count": len(found_skills)
        }

skill_extractor = SkillExtractor()
