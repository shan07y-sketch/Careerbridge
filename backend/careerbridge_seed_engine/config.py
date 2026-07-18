from dataclasses import dataclass, field
from typing import Tuple

@dataclass
class CountsConfig:
    # Scale knobs for the seed engine. These are intentionally the single
    # place to tune data volume -- do not hardcode counts inside generators.
    # Defaults target "enterprise-grade" scale (~10x the original modest
    # defaults) so pagination, search, analytics, and messaging features have
    # enough data to be meaningfully exercised and tested.
    students: int = 1200
    jobs: int = 400
    companies: int = 80
    recruiters: int = 150
    applications: int = 2500
    interviews: int = 450
    offers: int = 200
    conversations: int = 550
    messages_per_conversation: int = 10
    notifications: int = 2200

@dataclass
class GenerationConfig:
    seed: int = 42
    locale: str = "en_US"
    deterministic: bool = True
    target_countries: Tuple[str, ...] = ("India", "United States", "United Kingdom", "Canada", "Germany", "Singapore", "Australia", "United Arab Emirates")
    preferred_locations: Tuple[str, ...] = ("Remote", "Chennai", "Bangalore", "San Francisco", "London", "Toronto", "Berlin", "Singapore", "Sydney", "Dubai")
    student_email_domains: Tuple[str, ...] = ("university.edu", "student.edu", "campus.edu")
    portfolio_domains: Tuple[str, ...] = ("github.io", "vercel.app", "devpost.com")
    language_options: Tuple[str, ...] = ("English", "German", "French", "Spanish")
    degree_programs: Tuple[str, ...] = ("B.Tech", "B.E.", "M.Tech", "MCA", "B.Sc", "M.Sc")
    role_families: Tuple[str, ...] = ("Software Engineering", "Data Analytics", "Data Engineering", "Product Management", "Quality Assurance", "Cloud Engineering", "Cybersecurity", "UI/UX Design", "Business Analysis", "Technical Support")
    timezone: str = "UTC"
    graduation_year_start: int = 2024
    graduation_year_end: int = 2026
    skill_taxonomy: Tuple[str, ...] = (
        'Python', 'Java', 'JavaScript', 'TypeScript', 'SQL', 'Git', 'Linux', 'REST APIs',
        'Docker', 'PostgreSQL', 'React', 'Node.js', 'Pandas', 'NumPy', 'Power BI', 'Tableau',
        'Excel', 'Statistics', 'Machine Learning', 'Apache Spark', 'Airflow', 'Kafka', 'AWS',
        'GCP', 'Azure', 'Kubernetes', 'Terraform', 'HTML', 'CSS', 'Figma', 'UX Research',
        'Wireframing', 'Prototyping', 'Testing', 'Communication', 'Documentation',
        'Go', 'Rust', 'C++', 'C#', '.NET', 'GraphQL', 'MongoDB', 'Redis', 'RabbitMQ',
        'CI/CD', 'Jenkins', 'GitHub Actions', 'Microservices', 'System Design', 'Agile',
        'Scrum', 'Jira', 'Data Structures', 'Algorithms', 'Selenium', 'Cypress', 'Jest',
        'Vue.js', 'Angular', 'Next.js', 'Django', 'Flask', 'Spring Boot', 'gRPC',
    )

@dataclass
class DistributionsConfig:
    min_skills_per_student: int = 5
    max_skills_per_student: int = 15
    min_projects_per_student: int = 2
    max_projects_per_student: int = 4
    min_experience_per_student: int = 0
    max_experience_per_student: int = 2
    min_certificates_per_student: int = 0
    max_certificates_per_student: int = 3
    recruiter_response_rate_min: float = 0.3
    recruiter_response_rate_max: float = 0.8

@dataclass
class AppConfig:
    counts: CountsConfig = field(default_factory=CountsConfig)
    generation: GenerationConfig = field(default_factory=GenerationConfig)
    distributions: DistributionsConfig = field(default_factory=DistributionsConfig)

CONFIG = AppConfig()
