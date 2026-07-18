from enum import Enum

class WorkMode(str, Enum):
    hybrid = "hybrid"
    remote = "remote"
    onsite = "onsite"

class UserRole(str, Enum):
    recruiter = "recruiter"
    student = "student"
    employer = "employer"
    university = "university"
    admin = "admin"

class UserStatus(str, Enum):
    active = "active"
    pending = "pending"
    suspended = "suspended"

class EmploymentType(str, Enum):
    internship = "internship"
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"

class ModelBase:
    def __init__(self, **kwargs):
        # Set defaults to None for all discovered fields to prevent AttributeErrors
        for field in self._fields:
            setattr(self, field, None)
        # Apply passed kwargs
        for k, v in kwargs.items():
            setattr(self, k, v)

class AIRecommendation(ModelBase):
    _fields = ['career_goal_recommendations', 'career_recommendations', 'certification_recommendations', 'community_recommendations', 'company_recommendations', 'competition_recommendations', 'course_recommendations', 'generated_at', 'hackathon_recommendations', 'internship_recommendations', 'interview_recommendations', 'job_recommendations', 'mentor_recommendations', 'networking_recommendations', 'project_recommendations', 'recruiter_recommendations', 'resume_recommendations', 'salary_recommendations', 'student']

class Application(ModelBase):
    _fields = ['admin_experience_metadata', 'ai_analysis_metadata', 'application_history_metadata', 'application_reference', 'applied_at', 'ats_metadata', 'availability_date', 'company', 'cover_letter', 'documents_metadata', 'employer_experience_metadata', 'expected_salary', 'interview_readiness_metadata', 'job', 'last_updated_at', 'notifications_metadata', 'portfolio_url', 'preferred_location', 'recruiter', 'recruiter_review_metadata', 'referral', 'resume_version', 'source', 'status', 'student', 'student_experience_metadata', 'timeline_metadata', 'university_experience_metadata', 'work_authorization']

class CareerReport(ModelBase):
    _fields = ['ats_score', 'career_score', 'certification_strength', 'communication_score', 'experience_strength', 'generated_at', 'github_activity', 'interview_readiness', 'job_match_score', 'leadership_score', 'learning_progress', 'networking_score', 'overall_employability', 'portfolio_quality', 'problem_solving_score', 'profile_completion', 'project_strength', 'resume_score', 'student']

class Company(ModelBase):
    _fields = ['benefits', 'career_page_url', 'company_size', 'description', 'employee_count', 'founded_year', 'headquarters_city', 'headquarters_country', 'hiring_categories', 'industry', 'is_public_company', 'legal_name', 'logo_placeholder_url', 'metadata_json', 'name', 'slug', 'tech_stack', 'website_url', 'work_model']

class Interview(ModelBase):
    _fields = ['ai_analysis_metadata', 'analytics_metadata', 'application', 'company', 'duration_minutes', 'feedback_metadata', 'future_ai_metadata', 'history_metadata', 'instructions', 'interview_mode', 'interview_reference', 'interview_round', 'interview_type', 'job', 'location', 'meeting_id', 'meeting_link', 'meeting_metadata', 'meeting_platform', 'mock_interview_metadata', 'notifications_metadata', 'panel_metadata', 'passcode', 'questions_metadata', 'recruiter', 'room', 'scheduled_at', 'scheduled_date', 'scheduled_time', 'scheduling_metadata', 'status', 'student', 'timezone']

class Job(ModelBase):
    _fields = ['about_company', 'about_team', 'ai_metadata', 'analytics_metadata', 'application_deadline', 'application_pipeline_metadata', 'benefits', 'career_report_metadata', 'category', 'certifications', 'company', 'currency', 'department', 'description', 'employment_type', 'expected_joining_date', 'experience_max_years', 'experience_min_years', 'hiring_manager_name', 'hiring_process', 'is_active', 'job_reference', 'languages', 'location_city', 'location_country', 'matching_metadata', 'minimum_education', 'nice_to_have_skills', 'office_location', 'openings_count', 'posted_at', 'preferred_qualifications', 'preferred_skills', 'recruiter', 'required_gpa', 'required_skills', 'requirements', 'responsibilities', 'salary_max', 'salary_min', 'skill_gap_metadata', 'timezone', 'title', 'work_model']

class JobMatch(ModelBase):
    _fields = ['generated_at', 'student', 'top_companies', 'top_hybrid_jobs', 'top_industries', 'top_internship_matches', 'top_job_matches', 'top_locations', 'top_onsite_jobs', 'top_recruiters', 'top_remote_jobs']

class LearningRoadmap(ModelBase):
    _fields = ['available_study_time_hours', 'career_goal', 'current_skill_level', 'generated_at', 'graduation_date', 'interview_timeline_days', 'learning_speed', 'preferred_industry', 'student', 'target_company']

class Message(ModelBase):
    _fields = ['ai_metadata', 'ai_writing_support_metadata', 'analytics_metadata', 'attachments_metadata', 'body', 'delivered_at', 'future_ai_metadata', 'is_archived', 'is_deleted', 'is_edited', 'is_pinned', 'is_starred', 'meeting_metadata', 'message_type', 'notification_metadata', 'read_at', 'recipient', 'search_metadata', 'sender', 'sent_at', 'thread']

class Notification(ModelBase):
    _fields = ['action_url', 'body', 'category', 'clicked_at', 'created_at', 'cta_label', 'deep_link', 'delivered_at', 'icon', 'notification_type', 'opened_at', 'priority', 'status', 'title', 'user']

class Offer(ModelBase):
    _fields = ['application', 'base_salary', 'bonus', 'company', 'currency', 'expected_response_date', 'expiry_date', 'interview', 'issue_date', 'job', 'joining_bonus', 'joining_date', 'offer_number', 'offer_type', 'recruiter', 'status', 'stock_options', 'student', 'variable_pay']

class Recruiter(ModelBase):
    _fields = ['about_section', 'ai_metadata', 'ai_profile', 'awards', 'bio', 'calendar_metadata', 'calendar_url', 'candidate_watchlist', 'careerbridge_profile_url', 'city', 'company', 'country', 'department_name', 'email', 'employee_id', 'favorite_certifications', 'favorite_interview_questions', 'favorite_technologies', 'favorite_universities', 'full_name', 'future_relationships', 'hiring_domains', 'internal_notes', 'languages_spoken', 'linkedin_placeholder_handle', 'messaging_templates', 'metrics', 'network_metadata', 'office_location', 'pinned_announcement', 'portfolio_url', 'preferences_metadata', 'professional_achievements', 'profile_photo_url', 'recent_activity_feed', 'recently_filled_roles', 'recruiter_profile_url', 'response_rate', 'seniority_level', 'timezone', 'title', 'top_hiring_skills', 'upcoming_campus_visits', 'user', 'verification_metadata', 'years_experience']

class Resume(ModelBase):
    _fields = ['ats_score', 'is_primary', 'metadata_json', 'resume_score', 'student', 'title', 'version']

class ResumeAnalysis(ModelBase):
    _fields = ['achievement_statements_score', 'action_verbs_score', 'ats_score', 'certification_strength', 'education_quality', 'experience_quality', 'formatting_quality', 'generated_at', 'github_strength', 'grammar_quality', 'job_match_score', 'keyword_density', 'missing_keywords', 'portfolio_strength', 'professionalism', 'project_quality', 'quantified_impact_score', 'readability', 'resume_completeness', 'resume_quality', 'soft_skills_coverage', 'student', 'technical_skills_coverage']

class SkillGap(ModelBase):
    _fields = ['already_mastered_skills', 'critical_skills', 'generated_at', 'important_skills', 'missing_certifications', 'missing_experience', 'missing_github_activity', 'missing_portfolio_requirements', 'missing_soft_skills', 'missing_technologies', 'optional_skills', 'overall_skill_gap_pct', 'student']

class StudentCertification(ModelBase):
    _fields = ['credential_id', 'credential_url', 'expiry_date', 'issue_date', 'issued_by', 'name', 'skills_covered', 'student']

class StudentEducation(ModelBase):
    _fields = ['degree', 'description', 'end_year', 'field_of_study', 'grade', 'institution_name', 'start_year', 'student']

class StudentExperience(ModelBase):
    _fields = ['company', 'description', 'employment_type', 'end_date', 'is_current', 'location', 'start_date', 'student', 'title']

class StudentProfile(ModelBase):
    _fields = ['bio', 'career_goal', 'cgpa', 'city', 'country', 'date_of_birth', 'degree', 'department', 'github_url', 'graduation_year', 'headline', 'languages', 'linkedin_url', 'phone', 'portfolio_url', 'preferred_location', 'preferred_role', 'preferred_salary_max', 'preferred_salary_min', 'preferred_work_mode', 'profile_completion', 'university', 'user', 'website_url']

class StudentProject(ModelBase):
    _fields = ['end_date', 'impact_metrics', 'project_url', 'repository_url', 'start_date', 'student', 'summary', 'tech_stack', 'title']

class StudentSkill(ModelBase):
    _fields = ['category', 'is_primary', 'proficiency', 'skill_name', 'student', 'years_of_experience']

class University(ModelBase):
    _fields = ['city', 'country', 'departments', 'name', 'placement_strength', 'student_population']

class User(ModelBase):
    _fields = ['avatar_url', 'email', 'email_verified', 'first_name', 'last_name', 'last_login_at', 'password_hash', 'phone', 'role', 'status']

# Set Student alias to StudentProfile
Student = StudentProfile

class MessageThread(ModelBase):
    _fields = ['id', 'participants', 'messages', 'ai_metadata', 'analytics_metadata', 'category', 'conversation_type', 'created_at', 'future_ai_metadata', 'is_archived', 'is_pinned', 'network_metadata', 'notification_metadata', 'participant_one', 'participant_two', 'search_metadata', 'subject', 'updated_at']

class CareerPrediction(ModelBase):
    _fields = ['generated_at', 'student']

class CompanyRecommendation(ModelBase):
    _fields = ['generated_at', 'student', 'top_companies']

class MentorRecommendation(ModelBase):
    _fields = ['generated_at', 'student', 'top_mentors']

class MockInterview(ModelBase):
    _fields = ['behavior', 'coding_quality', 'communication', 'completion_status', 'confidence', 'created_at', 'interview_type', 'leadership', 'overall_score', 'problem_solving', 'sql_quality', 'student', 'system_design', 'target_company', 'target_role', 'technical_accuracy']

class NetworkingRecommendation(ModelBase):
    _fields = ['generated_at', 'student', 'suggested_connections']

class RecruiterRecommendation(ModelBase):
    _fields = ['generated_at', 'student', 'top_recruiters']

class SalaryPrediction(ModelBase):
    _fields = ['average_market_salary', 'currency', 'expected_entry_level_salary', 'expected_graduate_salary', 'expected_internship_salary', 'expected_salary_after_10_years', 'expected_salary_after_2_years', 'expected_salary_after_5_years', 'generated_at', 'maximum_salary_potential', 'minimum_expected_salary', 'salary_confidence', 'student']
