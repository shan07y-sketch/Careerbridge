import seed_engine
from careerbridge_seed_engine.config import AppConfig

config = AppConfig()
# Set small counts for testing
config.counts.students = 5
config.counts.jobs = 5
config.counts.companies = 2
config.counts.recruiters = 3
config.counts.applications = 5
config.counts.interviews = 3
config.counts.offers = 2
config.counts.conversations = 2
config.counts.messages_per_conversation = 3
config.counts.notifications = 5

print("Running companies generator...")
comp_res = seed_engine.generate_companies(config)
companies = comp_res.companies
print("Companies generated:", len(companies))

print("Running recruiters generator...")
rec_res = seed_engine.generate_recruiters(companies, config)
recruiters = rec_res.recruiters
print("Recruiters generated:", len(recruiters))

print("Running jobs generator...")
job_res = seed_engine.generate_jobs(companies, recruiters, config)
jobs = job_res.jobs
print("Jobs generated:", len(jobs))

# Wait, how are universities created? Let's check University class in careerbridge_seed_engine.models
from careerbridge_seed_engine.models import University, User, UserRole, UserStatus
# Let's create dummy universities manually since the seed engine requires them but doesn't generate them!
class MockDepartment:
    def __init__(self, name):
        self.name = name

univ_user = User(
    email="admin@university.edu",
    password_hash="hash",
    role=UserRole.university,
    status=UserStatus.active
)
univ = University(
    name="Test University",
    city="Test City",
    country="India",
    departments=(MockDepartment("Computer Science"), MockDepartment("Information Technology")),
    placement_strength="strong",
    student_population=5000,
    user=univ_user
)
universities = [univ]

print("Running students generator...")
stud_res = seed_engine.generate_students(universities, config)
# What attributes are in StudentGenerationResult?
print("Student result attributes:", dir(stud_res))
# Let's print properties
for attr in dir(stud_res):
    if not attr.startswith('_'):
        val = getattr(stud_res, attr)
        if isinstance(val, list):
            print(f"  {attr}: list of len {len(val)}")
        else:
            print(f"  {attr}: {type(val)}")

students = stud_res.students
resumes = stud_res.resumes
users = stud_res.users

print("Running applications generator...")
app_res = seed_engine.generate_applications(students, companies, recruiters, jobs, config)
applications = app_res.applications
print("  applications:", len(applications))

print("Running interviews generator...")
int_res = seed_engine.generate_interviews(applications, config)
interviews = int_res.interviews
print("  interviews:", len(interviews))

print("Running offers generator...")
off_res = seed_engine.generate_offers(applications, interviews, config)
offers = off_res.offers
print("  offers:", len(offers))

print("Running messages generator...")
msg_res = seed_engine.generate_messages(users, config)
messages = msg_res.messages
print("  messages:", len(messages))

print("Running notifications generator...")
not_res = seed_engine.generate_notifications(users, config)
notifications = not_res.notifications
print("  notifications:", len(notifications))

# 10. Career Reports (runs first)
print("Running career_reports generator...")
cr_res = seed_engine.generate_career_reports(
    students, companies, recruiters, jobs, applications, interviews, offers, messages, notifications, config
)
career_reports = cr_res.reports
print("  career_reports:", len(career_reports))

# 11. Skill Gaps (depends on career reports)
print("Running skill_gaps generator...")
sg_res = seed_engine.generate_skill_gaps(
    students, companies, recruiters, jobs, applications, interviews, offers, career_reports, config
)
skill_gaps = sg_res.skill_gaps
print("  skill_gaps:", len(skill_gaps))

# 12. Learning Roadmaps (depends on career reports and skill gaps)
print("Running learning_roadmaps generator...")
lr_res = seed_engine.generate_learning_roadmaps(
    students, jobs, companies, recruiters, career_reports, skill_gaps, applications, interviews, offers, config
)
roadmaps = lr_res.roadmaps
print("  roadmaps:", len(roadmaps))

# 13. Resume Analyses
print("Running resume_analyses generator...")
res_an_res = seed_engine.generate_resume_analyses(
    students, companies, recruiters, jobs, applications, interviews, career_reports, skill_gaps, roadmaps, config
)
analyses = res_an_res.analyses
print("  analyses:", len(analyses))

# 14. Mock Interviews
print("Running mock_interviews generator...")
mock_int_res = seed_engine.generate_mock_interviews(
    students, jobs, interviews, analyses, career_reports, skill_gaps, roadmaps, config
)
mock_interviews = mock_int_res.mock_interviews
print("  mock_interviews:", len(mock_interviews))

# 15. Job Matches
print("Running job_matches generator...")
job_match_res = seed_engine.generate_job_matches(
    students, companies, recruiters, jobs, applications, interviews, offers, career_reports, skill_gaps, roadmaps, analyses, config
)
matches = job_match_res.job_matches
print("  matches:", len(matches))

# 16. AI Recommendations
print("Running ai_recommendations generator...")
ai_rec_res = seed_engine.generate_ai_recommendations(
    students, companies, recruiters, jobs, applications, interviews, offers, messages, notifications, career_reports, skill_gaps, roadmaps, analyses, matches, config
)
recommendations = ai_rec_res.recommendations
print("  recommendations:", len(recommendations))

# 17. Manual Career Predictions (no generator exists, but models/classes need it)
import datetime
from careerbridge_seed_engine.models import CareerPrediction
career_predictions = [
    CareerPrediction(student=student, generated_at=datetime.datetime.utcnow())
    for student in students
]
print("  career_predictions (manual):", len(career_predictions))

# 18. Salary Predictions
print("Running salary_predictions generator...")
sal_res = seed_engine.generate_salary_predictions(
    students, companies, recruiters, jobs, applications, interviews, offers, career_reports, skill_gaps, roadmaps, analyses, matches, career_predictions, config
)
predictions = sal_res.salary_predictions
print("  predictions:", len(predictions))

# 19. Company Recommendations
print("Running company_recommendations generator...")
comp_rec_res = seed_engine.generate_company_recommendations(
    students, companies, recruiters, jobs, applications, interviews, offers, career_reports, skill_gaps, roadmaps, analyses, matches, recommendations, career_predictions, predictions, [], config
)
comp_recommendations = comp_rec_res.company_recommendations
print("  comp_recommendations:", len(comp_recommendations))

# 20. Recruiter Recommendations
print("Running recruiter_recommendations generator...")
rec_rec_res = seed_engine.generate_recruiter_recommendations(
    students, companies, recruiters, jobs, applications, interviews, offers, career_reports, skill_gaps, roadmaps, analyses, matches, recommendations, career_predictions, predictions, config
)
rec_recommendations = rec_rec_res.recruiter_recommendations
print("  rec_recommendations:", len(rec_recommendations))

# 21. Networking Recommendations
print("Running networking_recommendations generator...")
net_res = seed_engine.generate_networking_recommendations(
    students, companies, recruiters, jobs, applications, interviews, offers, messages, career_reports, skill_gaps, roadmaps, analyses, matches, rec_recommendations, comp_recommendations, config
)
net_recs = net_res.networking_recommendations
print("  net_recs:", len(net_recs))

# 22. Mentor Recommendations
print("Running mentor_recommendations generator...")
ment_res = seed_engine.generate_mentor_recommendations(
    students, companies, recruiters, jobs, interviews, offers, career_reports, skill_gaps, roadmaps, analyses, matches, rec_recommendations, comp_recommendations, net_recs, config
)
ment_recs = ment_res.mentor_recommendations
print("  ment_recs:", len(ment_recs))




