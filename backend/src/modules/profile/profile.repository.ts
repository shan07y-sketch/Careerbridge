import { prisma } from '../../config/database';

export class ProfileRepository {
  static async getStudentProfile(userId: string) {
    return prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        educationHistory: true,
        experienceHistory: true,
        projects: true,
        certifications: true,
        skills: { include: { skill: true } }
      }
    });
  }

  static async updateStudentProfile(userId: string, data: any) {
    return prisma.studentProfile.update({
      where: { userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        currentGpa: data.currentGpa,
        preferredRole: data.preferredRole,
        preferredWorkMode: data.preferredWorkMode,
        preferredLocations: data.preferredLocations,
        // AI Preferences (Settings tab) -- as any until `prisma generate`
        // picks up the new columns from the 20260717150000 migration.
        ...(data.careerPath !== undefined ? { careerPath: data.careerPath } : {}),
        ...(data.targetCompanies !== undefined ? { targetCompanies: data.targetCompanies } : {}),
        ...(data.targetSalaryRange !== undefined ? { targetSalaryRange: data.targetSalaryRange } : {}),
        ...(data.jobTypePreference !== undefined ? { jobTypePreference: data.jobTypePreference } : {}),
        ...(data.preferredIndustries !== undefined ? { preferredIndustries: data.preferredIndustries } : {}),
        ...(data.recommendationFrequency !== undefined ? { recommendationFrequency: data.recommendationFrequency } : {})
      } as any
    });
  }

  static async addEducation(studentProfileId: string, data: any) {
    return prisma.education.create({
      data: {
        studentProfileId,
        institution: data.institution,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        gpa: data.gpa
      }
    });
  }

  static async addExperience(studentProfileId: string, data: any) {
    return prisma.experience.create({
      data: {
        studentProfileId,
        companyName: data.companyName,
        roleTitle: data.roleTitle,
        employmentType: data.employmentType,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isCurrent: data.isCurrent || false,
        description: data.description,
        location: data.location
      }
    });
  }

  static async addProject(studentProfileId: string, data: any) {
    return prisma.project.create({
      data: {
        studentProfileId,
        title: data.title,
        description: data.description,
        linkUrl: data.linkUrl,
        repoUrl: data.repoUrl,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null
      }
    });
  }

  static async addSkill(studentProfileId: string, skillName: string, level = 50) {
    const skill = await prisma.skill.upsert({
      where: { name: skillName },
      update: {},
      create: { name: skillName }
    });
    return prisma.studentSkill.create({
      data: {
        studentProfileId,
        skillId: skill.id,
        level
      }
    });
  }

  static async addCertification(studentProfileId: string, data: any) {
    return prisma.certification.create({
      data: {
        studentProfileId,
        name: data.name,
        issuingOrg: data.issuingOrg,
        issueDate: new Date(data.issueDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        credentialId: data.credentialId,
        credentialUrl: data.credentialUrl
      }
    });
  }
}
