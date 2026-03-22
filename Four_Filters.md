# Four Filters — Completed Example
**Team Name:** CineMatch AI  
**Team Members:** Giorgi T. | Gela L. | Ivane U.  
**Date:** Friday 22 March 2026

---

## Step 1: Surface All Ideas

| # | Idea | Proposed by |
|---|------|------------|
| 1 | AI Study Assistant for Students | Giorgi T. |
| 2 | AI Meeting Summarizer / Organizer | Gela L. |
| 3 | AI-Assisted Couple Movie Recommender (Film Adviser) | Ivane U. |

---

## Step 2: Quick Filter Pass

| Idea # | Filter 1: Real Problem? | Filter 2: AI Adds Value? | Filter 3: Buildable? | Filter 4: Motivated? | Overall |
|--------|------------------------|--------------------------|--------------------|--------------------|---------|
| 1 (Study Assistant) | ✓ | ✓ | ✓ | ? | Weak survivor |
| 2 (Meeting Summarizer) | ? | ? | ✓ | ? | Weak survivor |
| 3 (Film Adviser) | ✓ | ✓ | ✓ | ✓ | Strong survivor |

**Ideas that survived:** 1 (Study Assistant), 3 (Film Adviser)

---

## Step 3: Deep Dive on Survivors

### Idea 1: AI Study Assistant
**Weakest filter:** Filter 4 — Motivation

**What would need to be true for this filter to be a clear pass?**  

- Team must have personal interest in improving student study habits.  
- Would require testing AI-generated quizzes and adaptive recommendations with peers to make the demo engaging.  

**Can this idea be reshaped to address the weakness? How?**  

- Scope the MVP to simple summarization and small quiz sets.  
- Focus on fun interactive demo with immediate feedback to engage team and users.  

### Idea 3: Film Adviser
**Weakest filter:** None — passes all filters strongly

**What would need to be true for this filter to be a clear pass?**  

- Already strong: AI balances preferences, recommends movies, tracks fairness, and generates explanations.  
- Users (friends/couples) are easy to reach for testing.  

**Can this idea be reshaped to address the weakness? How?**  

- Optional: gamification or social sharing can be added for extra engagement post-course.  

---

## Step 4: Decision

**Our chosen project:** **Film Adviser — an AI tool that helps couples pick movies fairly by balancing preferences, tracking fairness, and generating personalized recommendations.**

**Why this idea over the alternatives:**  

- Passes all four filters cleanly — real problem, strong AI core, technically feasible, and highly motivating for the team.  
- Fun and interactive, easy to demo by Week 12.  
- AI is central — balancing preferences, scoring movies, and fairness tracking would be impractical without AI.  
- High engagement potential and a portfolio-worthy demo.  

**The one thing we are most uncertain about:**  

- How users will interact with fairness scoring long-term, and whether the explanations need tuning for clarity.  

---

## Filter Answers for Film Adviser

**Filter 1: Problem**  
- **Who specifically has this problem?** Couples or friends deciding on movies together, especially with differing tastes.  
- **Current workaround:** Flip a coin, compromise, scroll endlessly on streaming services.  
- **Cost of problem:** Small arguments, decision fatigue, wasted time.  
- **Can you reach a real user in 2 weeks?** Yes. Friends, social media users, or university peers.  

**Filter 2: AI**  
- **What does AI specifically do?**  
  - Scores movies for each partner based on preferences (genre, mood, length, intensity).  
  - Calculates a balanced satisfaction score and fairness indicator.  
  - Generates short explanation for recommendations.  
- **Which course week is most relevant?** Week 4 (Recommendation systems, scoring and reasoning).  
- **What would the product look like without AI?** Manual selection or simple preference filters; fairness balancing would be impossible.  
- **Is AI doing something impossible before?** Not impossible but highly impractical — balancing multiple preferences and fairness history manually is unrealistic.  

**Filter 3: Feasibility**  
- **Required APIs:** TMDb or IMDb API for movie data; OpenAI for explanation generation.  
- **Hardest technical problem:** Scoring and balancing algorithm to maximize joint satisfaction while tracking fairness.  
- **Does anyone know how to solve it?** Yes — team members have programming experience and can implement preference scoring and fairness logic within 12 weeks.  
- **MVP:** Each partner selects preferences → AI recommends top 3–5 movies with satisfaction scores and fairness indicator → optional short explanation.  

**Filter 4: Motivation**  
- **Week 12 demo scene:** Couple inputs their movie preferences. The AI recommends 5 movies with scores for each partner and shows who compromised more recently. The couple selects a movie confidently, seeing a fairness indicator and explanation.  
- **Who cares about this domain?** All team members — team enjoys movies and choosing together, making this personally motivating.  
- **Beyond the course?** Strong potential — could be extended as a consumer app for couples or social movie recommendation platforms.  

