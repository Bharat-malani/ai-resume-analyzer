import re
import io
from typing import Dict, Any, List
from pypdf import PdfReader
from docx import Document

class ResumeParser:
    """
    Robust resume parser for PDF and DOCX files.
    Extracts text, normalizes whitespace, extracts contact details and sections.
    """

    SECTION_HEADERS = {
        "summary": [
            r"summary", r"professional summary", r"executive summary", 
            r"profile", r"about me", r"objective", r"career objective"
        ],
        "education": [
            r"education", r"academic background", r"academic history", 
            r"qualification", r"qualifications", r"educational background"
        ],
        "skills": [
            r"skills", r"technical skills", r"core competencies", 
            r"technologies", r"areas of expertise", r"skills & tools",
            r"technical proficiencies", r"key skills"
        ],
        "experience": [
            r"experience", r"work experience", r"employment history", 
            r"professional experience", r"internships", r"work history"
        ],
        "projects": [
            r"projects", r"academic projects", r"key projects", 
            r"personal projects", r"technical projects"
        ],
        "certifications": [
            r"certifications", r"certificates", r"licenses", 
            r"courses", r"professional certifications"
        ],
        "achievements": [
            r"achievements", r"awards", r"honors", 
            r"accomplishments", r"extracurricular activities"
        ],
        "publications": [
            r"publications", r"research", r"papers"
        ],
        "languages": [
            r"languages", r"spoken languages"
        ]
    }

    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        """Extract plain text from PDF bytes."""
        text_parts = []
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_parts.append(extracted)
        except Exception as e:
            raise ValueError(f"Failed to read PDF document: {str(e)}")
        
        return "\n".join(text_parts)

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        """Extract plain text from DOCX bytes."""
        try:
            doc = Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            
            # Also extract tables
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                    if row_text:
                        paragraphs.append(row_text)
                        
            return "\n".join(paragraphs)
        except Exception as e:
            raise ValueError(f"Failed to read DOCX document: {str(e)}")

    @staticmethod
    def normalize_text(text: str) -> str:
        """Clean and normalize text while preserving sentence/paragraph boundaries."""
        if not text:
            return ""
        # Replace non-breaking spaces and unusual whitespace
        text = text.replace('\xa0', ' ').replace('\r\n', '\n').replace('\r', '\n')
        # Remove repeated tabs/spaces within lines
        text = re.sub(r'[ \t]+', ' ', text)
        # Collapse 3 or more newlines to 2
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    @classmethod
    def extract_personal_info(cls, text: str) -> Dict[str, Any]:
        """Extract contact info: email, phone, name, linkedin, github, portfolio."""
        info = {
            "name": "",
            "email": "",
            "phone": "",
            "linkedin": "",
            "github": "",
            "website": ""
        }

        # 1. Email Regex
        email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        email_match = re.search(email_pattern, text)
        if email_match:
            info["email"] = email_match.group(0).strip()

        # 2. Phone Regex (supports international, US, standard formats)
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3}[-.\s]?\d{3,4}\b'
        phone_matches = re.finditer(phone_pattern, text)
        for m in phone_matches:
            phone_str = m.group(0).strip()
            # Filter out dates or small numbers
            digits = re.sub(r'\D', '', phone_str)
            if 10 <= len(digits) <= 15:
                info["phone"] = phone_str
                break

        # 3. LinkedIn Regex
        linkedin_pattern = r'(https?://(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_-]+|linkedin\.com/in/[a-zA-Z0-9_-]+)'
        li_match = re.search(linkedin_pattern, text, re.IGNORECASE)
        if li_match:
            info["linkedin"] = li_match.group(0).strip()

        # 4. GitHub Regex
        github_pattern = r'(https?://(?:www\.)?github\.com/[a-zA-Z0-9_-]+|github\.com/[a-zA-Z0-9_-]+)'
        gh_match = re.search(github_pattern, text, re.IGNORECASE)
        if gh_match:
            info["github"] = gh_match.group(0).strip()

        # 5. Portfolio / Website
        web_pattern = r'https?://(?:www\.)?(?!linkedin|github)[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:/[^\s]*)?'
        web_match = re.search(web_pattern, text, re.IGNORECASE)
        if web_match:
            info["website"] = web_match.group(0).strip()

        # 6. Extract candidate name from top 10 non-empty lines
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        for line in lines[:8]:
            # Skip if contains email, phone, links, or common header words
            lower_line = line.lower()
            if (any(char.isdigit() for char in line) or
                "@" in line or "http" in line or "linkedin" in line or "github" in line or
                "resume" in lower_line or "curriculum vitae" in lower_line or "cv" == lower_line or
                "page" in lower_line or len(line.split()) > 5 or len(line.split()) < 2):
                continue
            
            # Candidate name found if characters are alphabetic with spaces or initials
            if re.match(r'^[A-Z][a-zA-Z.\'-]+(?:\s+[A-Z][a-zA-Z.\'-]+)+$', line):
                info["name"] = line
                break

        if not info["name"] and lines:
            # Fallback to first clean short alphabetic line
            for line in lines[:5]:
                if re.match(r'^[A-Za-z\s.\'-]{3,35}$', line) and not any(k in line.lower() for k in ["resume", "cv", "profile", "contact"]):
                    info["name"] = line
                    break

        return info

    @classmethod
    def segment_sections(cls, text: str) -> Dict[str, str]:
        """
        Segment resume text into standard sections based on detected headings.
        """
        lines = text.split('\n')
        sections = {
            "summary": "",
            "education": "",
            "skills": "",
            "experience": "",
            "projects": "",
            "certifications": "",
            "achievements": "",
            "publications": "",
            "languages": "",
            "other": ""
        }

        # Build regex patterns for section boundaries
        header_patterns = {}
        for sec_name, keywords in cls.SECTION_HEADERS.items():
            pattern = r'^\s*(?:[\d\.\-\*•]+\s*)?(?:' + '|'.join(keywords) + r')(?:\s*[:\-\—]?\s*)?$'
            header_patterns[sec_name] = re.compile(pattern, re.IGNORECASE)

        current_section = "other"
        section_lines: Dict[str, List[str]] = {sec: [] for sec in sections}

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            # Check if this line is a section header (usually short, <= 45 chars)
            matched_header = None
            if len(stripped) <= 45:
                for sec_name, pattern in header_patterns.items():
                    if pattern.match(stripped):
                        matched_header = sec_name
                        break

            if matched_header:
                current_section = matched_header
            else:
                section_lines[current_section].append(line)

        # Join the lines for each section
        for sec, l_list in section_lines.items():
            sections[sec] = "\n".join(l_list).strip()

        return sections

    @classmethod
    def parse(cls, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Complete parsing pipeline from raw bytes."""
        lower_name = filename.lower()
        if lower_name.endswith('.pdf'):
            raw_text = cls.extract_text_from_pdf(file_bytes)
        elif lower_name.endswith('.docx'):
            raw_text = cls.extract_text_from_docx(file_bytes)
        else:
            raise ValueError("Unsupported file format. Please upload a PDF or DOCX file.")

        normalized_text = cls.normalize_text(raw_text)
        if len(normalized_text.strip()) < 30:
            raise ValueError("The uploaded document contains insufficient or unreadable text.")

        personal_info = cls.extract_personal_info(normalized_text)
        sections = cls.segment_sections(normalized_text)

        return {
            "personal_info": personal_info,
            "sections": sections,
            "raw_text": normalized_text,
            "word_count": len(normalized_text.split()),
            "character_count": len(normalized_text)
        }
