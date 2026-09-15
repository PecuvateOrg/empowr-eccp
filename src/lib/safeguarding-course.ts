// GENERATED from the Empowr safeguarding mock-up in the handover pack.
// Ported rather than re-authored: this is safeguarding guidance, so the wording
// is Empowr's and must not drift. Regenerate if the mock-up changes.
//
// `body` and `callout` hold trusted authored HTML that ships compiled into the
// bundle. It is never user input, which is what makes rendering it directly safe.

export interface ScenarioOption {
  readonly text: string;
  readonly recommended: boolean;
  readonly feedback: string;
}

export interface Scenario {
  readonly prompt: string;
  readonly options: readonly ScenarioOption[];
}

interface ModuleBase {
  readonly slug: string;
  readonly order: number;
  readonly label: string;
  readonly eyebrow: string;
  readonly title: string;
}

export type CourseModule =
  | (ModuleBase & {
      readonly kind: "content";
      readonly body: string;
      readonly callout: string | null;
      readonly image: string | null;
      readonly imageAlt: string | null;
      readonly imageCaption: string | null;
    })
  | (ModuleBase & { readonly kind: "scenario"; readonly scenarios: readonly Scenario[] })
  | (ModuleBase & { readonly kind: "reflection"; readonly prompt: string; readonly placeholder: string });

export const courseModules: readonly CourseModule[] = [
  {
    kind: "content",
    slug: "safeguarding-responsibilities-for-empowr-coaches",
    order: 1,
    label: "Introduction",
    eyebrow: "1 of 20 · Your safeguarding role",
    title: "Safeguarding responsibilities for Empowr coaches",
    body: "\n      <p>This course sets out Empowr's in-depth safeguarding standard for coaching roles. It draws on the subjects commonly covered in recognised UK safeguarding training for sports coaches while applying them directly to Empowr's sessions, venues and procedures.</p>\n      <p>A Minimum Deployment Requirement is the baseline a coach must meet before being permitted to lead or support a session—it is not an optional extra.</p>\n      <p>As an assistant coach or head coach, you hold a greater level of responsibility than a volunteer. You help plan and deliver sessions, make judgement calls within Empowr's safe skating space—referred to throughout this course as \"the rink\"—and may be the first person someone approaches with a safeguarding concern.</p>\n      <p>Throughout this course, \"the rink\" means Empowr's entire supervised skating environment—not only the skating floor. Depending on the venue, this may include the entrance, registration area, seating areas, equipment area, toilets and the arrangements for skaters arriving and leaving.</p>\n      <p>Head coaches, assistant coaches and Junior Assistant Coaches all contribute to safeguarding, but their authority and responsibilities are different. The next three pages explain the expectations for each role.</p>\n      <p>Whatever your role or level of seniority, safeguarding is everyone's responsibility. Every coach must act when they see, hear or receive a concern.</p>\n      <p><strong>By the end of this course, you will be equipped to:</strong></p>\n      <ul>\n        <li>Recognise poor practice, signs of abuse and safeguarding concerns.</li>\n        <li>Apply a child-centred approach to coaching.</li>\n        <li>Follow and uphold Empowr's Code of Conduct.</li>\n        <li>Respond appropriately when a concern is raised.</li>\n        <li>Record and report concerns through the correct safeguarding procedures—including concerns involving a colleague.</li>\n      </ul>\n    ",
    callout: "<strong>Before you start:</strong> this course assumes you've already completed Empowr's Standard Safeguarding volunteer course, or hold equivalent prior knowledge. You are not expected to investigate safeguarding concerns yourself. Your responsibility is to <strong>recognise, respond, record and report</strong>.",
    image: "/course/safeguarding-responsibilities-for-empowr-coaches.jpg",
    imageAlt: "Empowr-style roller-skating coaches supporting children wearing protective equipment in a community sports hall",
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "the-head-coach-role",
    order: 2,
    label: "Head coaches",
    eyebrow: "2 of 20 · Head Coach responsibilities",
    title: "The Head Coach role",
    body: "\n      <p>The Head Coach holds overall responsibility for the safe planning, staffing and delivery of the session. They lead the coaching team and make the final decision when an activity, environment or staffing arrangement becomes unsafe.</p>\n      <p><strong>Head Coaches are responsible for:</strong></p>\n      <ul>\n        <li>Understanding and maintaining Empowr's staffing and supervision ratios.</li>\n        <li>Planning sessions that can be delivered safely and in line with Empowr's safeguarding standards.</li>\n        <li>Reviewing and approving activities or ideas proposed by Assistant Coaches before they are delivered.</li>\n        <li>Assigning clear roles, groups and responsibilities to coaches, Junior Assistant Coaches and volunteers.</li>\n        <li>Confirming who is directly supervising each Junior Assistant Coach.</li>\n        <li>Monitoring the overall safety and wellbeing of skaters and the coaching team across Empowr's full safe skating space.</li>\n        <li>Adapting, pausing or stopping an activity when staffing, behaviour, equipment or the environment becomes unsafe.</li>\n        <li>Checking the register and ensuring arrival, collection and independent-leaving permissions are followed.</li>\n        <li>Ensuring safeguarding concerns, disclosures and incidents are responded to, recorded and reported correctly.</li>\n      </ul>\n      <p>The Head Coach retains overall responsibility for the session, but this does not remove the individual safeguarding duties held by every other coach.</p>\n    ",
    callout: "<strong>Key point:</strong> overall responsibility means actively checking that the agreed safeguards are working throughout the session—not only setting them at the start.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "the-assistant-coach-role",
    order: 3,
    label: "Assistant coaches",
    eyebrow: "3 of 20 · Assistant Coach responsibilities",
    title: "The Assistant Coach role",
    body: "\n      <p>An Assistant Coach supports the Head Coach with the safe delivery of the agreed session plan. They may use their coaching judgement and contribute ideas, but they must work within their training, experience and assigned responsibilities.</p>\n      <p><strong>Assistant Coaches are responsible for:</strong></p>\n      <ul>\n        <li>Following the session plan and instructions provided by the Head Coach.</li>\n        <li>Delivering assigned activities safely and within the limits of their training and experience.</li>\n        <li>Maintaining active supervision and remaining attentive to skaters' safety, behaviour and wellbeing.</li>\n        <li>Checking with the Head Coach before introducing or materially changing an activity.</li>\n        <li>Raising concerns about an activity, skater, colleague or environment immediately.</li>\n        <li>Stopping an unsafe activity and seeking support from the Head Coach when needed.</li>\n        <li>Following Empowr's safeguarding procedures and Code of Conduct.</li>\n        <li>Directly supervising a Junior Assistant Coach when formally assigned to do so.</li>\n      </ul>\n      <p>An Assistant Coach must not assume the Head Coach's authority unless Empowr has formally assigned them to lead. If the Head Coach becomes unavailable, the session must not continue until responsibility has been transferred to an authorised coach and safe staffing has been confirmed.</p>\n    ",
    callout: "<strong>Key point:</strong> Assistant Coaches should contribute ideas and use their judgement, but the Head Coach approves the session plan and monitors its overall safe delivery.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "junior-assistant-coaches-supported-responsibility",
    order: 4,
    label: "Junior assistants",
    eyebrow: "4 of 20 · Ages 16–17",
    title: "Junior Assistant Coaches: supported responsibility",
    body: "\n      <p>A Junior Assistant Coach is aged <strong>16 to under 18</strong>. Their role is to shadow and support the coaching team, build experience and help deliver agreed activities within clear boundaries.</p>\n      <p>Once formally assigned to the role and considered trained and competent by Empowr, a Junior Assistant Coach may count within Empowr's maximum ratio of <strong>one coach to 16 children</strong>. However, they must <strong>never be unsupervised under any circumstances</strong>.</p>\n      <p>A named adult head coach or assistant coach must directly supervise them throughout the session and remain close enough to see, hear and intervene. A Junior Assistant Coach may support an assigned group or activity only while they remain visible and audible to that supervising adult.</p>\n      <p><strong>A Junior Assistant Coach must not:</strong></p>\n      <ul>\n        <li>Be the only coach in the hall or activity area, lead a session alone or cover an adult coach's absence.</li>\n        <li>Supervise children out of the sight or hearing of an adult coach.</li>\n        <li>Be alone with an individual child or take a child into a separate or isolated room.</li>\n        <li>Search for a missing child alone or remain with children while all adult coaches leave.</li>\n        <li>Independently manage collection changes, aggressive parents, complaints, serious incidents, medical or safeguarding records, medication or disclosures.</li>\n        <li>Use personal contact details or social media to communicate with skaters.</li>\n      </ul>\n      <p>If their supervising adult needs to leave, responsibility must be clearly transferred to another authorised adult coach. If this is not possible, the activity must pause and the Junior Assistant Coach must remain with the head coach or another supervised group.</p>\n      <p>Turning 18 does not automatically make someone an adult assistant coach. Empowr must review the role and confirm that all adult coaching requirements have been met.</p>\n    ",
    callout: "<strong>Remember:</strong> Junior Assistant Coaches may count within the ratio, but they must always work under the direct supervision of a named adult coach.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "the-law-and-policy-behind-safeguarding",
    order: 5,
    label: "Law & policy",
    eyebrow: "5 of 20 · The framework",
    title: "The law and policy behind safeguarding",
    body: "\n      <p>Safeguarding in England sits on a legal foundation. The Children Act 1989 established that a child's welfare is paramount, and <em>Working Together to Safeguard Children</em> sets out how organisations and individuals should act on that duty.</p>\n      <p>The Protection of Freedoms Act 2012 governs DBS checks and barred-list checking. Coaches working in \"regulated activity\" with children must never be barred from working with children — Empowr's DBS checks confirm this before deployment.</p>\n      <p>Empowr's own safeguarding policy sits inside this wider framework. Where Empowr's policy is more specific than the law — our ratios, or our media consent rules, for example — the more specific standard always applies.</p>\n      <p>Two DBS levels matter for coaches: a <strong>basic</strong> check confirms unspent convictions; an <strong>enhanced check with barred list</strong> additionally confirms you're not barred from working with children — this is the level Empowr requires for every coaching role.</p>\n    ",
    callout: "Not sure which policy takes precedence? Ask the Empowr DSL—that's exactly what the role is there for.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "categories-of-abuse-and-harm-in-a-sport-setting",
    order: 6,
    label: "Abuse & harm",
    eyebrow: "6 of 20 · Recognise it",
    title: "Categories of abuse and harm, in a sport setting",
    body: "\n      <ul>\n        <li><strong>Physical abuse</strong> in sport can look like excessive, punitive drills, being pushed to train through injury, or inappropriate use of contact when \"correcting\" technique.</li>\n        <li><strong>Emotional abuse</strong> can look like persistent criticism, humiliation in front of peers, favouritism that isolates a skater, or pressure that removes a young person's choice about whether to continue.</li>\n        <li><strong>Sexual abuse</strong> includes any sexual activity with a child. Grooming behaviour — building trust, offering special attention or gifts, engineering time alone — is a warning sign in itself, regardless of whether anything further happens.</li>\n        <li><strong>Neglect</strong> in a coaching context can mean skaters left without supervision, without water or rest, or coaching that overlooks signs of injury or exhaustion.</li>\n        <li><strong>Exploitation and bullying</strong>, including online and between skaters, are safeguarding matters — not just discipline issues.</li>\n      </ul>\n    ",
    callout: "Grooming behaviour rarely looks dramatic. It looks like someone being unusually generous with their time, attention, or exceptions — to one person.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "a-child-centred-approach-to-coaching",
    order: 7,
    label: "Child-centred",
    eyebrow: "7 of 20 · Reflect on your practice",
    title: "A child-centred approach to coaching",
    body: "\n      <p>Being child-centred means putting the young person's welfare and voice at the centre of every coaching decision — not just their skate performance.</p>\n      <p>It's worth reflecting honestly: do your skaters feel able to say \"no\" to you, or to a drill, without consequence? Would they come to you with a concern? If you're not sure, that's a useful place to start.</p>\n      <p>Coaches hold power — over selection, attention, praise, and access to opportunities. Being aware of that power, and of your own blind spots, is part of using it responsibly.</p>\n      <p>Consider how you'd respond if a skater challenged something you asked them to do. A child-centred coach treats that as useful information, not defiance.</p>\n    ",
    callout: "This module has no \"test\" — it's a reflection, not a checklist. Coaches who reflect honestly here are the ones who build genuine trust.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "good-practice-vs-poor-practice-skate-by-skate",
    order: 8,
    label: "Practice",
    eyebrow: "8 of 20 · In practice",
    title: "Good practice vs poor practice, skate by skate",
    body: "\n      <ul>\n        <li><strong>Spotting a fall:</strong> brief, task-focused contact, given openly. <em>Not:</em> prolonged or unnecessary contact, or contact given away from other adults' view.</li>\n        <li><strong>1:1 technique coaching:</strong> held where others can see and hear, with a reason recorded. <em>Not:</em> regular closed-door or off-site 1:1 sessions with no record.</li>\n        <li><strong>Changing and equipment areas:</strong> supervised by same-gender staff where practical, coaches don't enter alone. <em>Not:</em> a coach alone with a skater in a changing area.</li>\n        <li><strong>Trips and socials:</strong> written parental consent, named ratios, a second adult present. <em>Not:</em> informal trips arranged directly with skaters, without Empowr sign-off.</li>\n        <li><strong>Communication:</strong> through Empowr's official channels, copying in another adult or the DSL. <em>Not:</em> personal messaging, social DMs, or contact outside session hours with an individual skater.</li>\n      </ul>\n    ",
    callout: "If a practice would feel uncomfortable to explain plainly to a parent or the Empowr DSL, don't do it—no matter how well-intentioned.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "safeguarding-while-coaching-an-empowr-session",
    order: 9,
    label: "Coaching a session",
    eyebrow: "9 of 20 · On the rink floor",
    title: "Safeguarding while coaching an Empowr session",
    body: "\n      <p>Safeguarding isn't separate from your coaching technique — it's built into how you run every minute on the rink.</p>\n      <p><strong>Hands-on teaching and spotting:</strong> when guiding a stance or catching a fall, use the minimum contact needed for the skill — a hand at the elbow or waist, not a full hold — and say what you're about to do before you do it (\"I'm going to hold your arm so you don't fall\"). Always coach from a position other adults or skaters can see.</p>\n      <p><strong>Falls and injuries:</strong> if a skater goes down, don't move them — check first. Ask if they can move each part of their body before helping them up, and never lift or pull someone who might be seriously hurt. For a minor fall with no sign of injury, offer a hand and let the skater use it to pull themselves up, rather than lifting them.</p>\n      <p><strong>First-aid response:</strong> the session's designated first aider leads the on-site response. As a coach, keep the skater safe and calm, stop the activity or move the group away if needed, and alert the first aider immediately. Anyone may call 999 when emergency help is required; do not delay an emergency call while waiting for permission. Know who holds the first-aid role before the session starts.</p>\n      <p>Every injury, however minor, is logged in the venue's accident book on the day it happens, by the first aider or under their direction — including what happened, what was done, and who was informed. A near-miss (no injury, but something that could have caused one) is worth reporting too, so Empowr can fix the hazard before someone is hurt.</p>\n      <p><strong>Protective gear:</strong> roller skating is a high-risk activity, and Empowr's equipment rules are enforced—not treated as optional guidance. Every skater under 15 must wear a fitted and fastened helmet, wrist guards, elbow pads and knee pads for the whole session, with no exceptions. Children must use quad skates; inline skates are not permitted. Anyone arriving without the required equipment cannot participate. Skaters aged 15 and over may choose whether to wear protective gear unless the requirements for their particular session state otherwise. If you see someone skating in a way that places them at risk of harm, you must step in, adapt or stop the activity, and require protective gear where appropriate.</p>\n      <p><strong>Fitting helmets and pads:</strong> guide the skater or a parent to adjust their own equipment where possible. Where you need to adjust it yourself, do it briefly, explain what you're doing, and do it somewhere others can see.</p>\n      <p><strong>Warm-up and pacing:</strong> start every session with a warm-up appropriate to the group, and pace drills to the least confident skater in the group, not the most advanced — pushing a nervous skater to keep up is a safeguarding issue as much as a coaching one.</p>\n      <p><strong>Keeping the group in view:</strong> take a headcount at the start of the session, after any break, and at the end. Position yourself so you can see the whole group and the exits, and agree a clear stop signal (whistle, raised hand) before you start.</p>\n      <p><strong>Grouping by ability:</strong> split larger sessions by skill level so no skater is either bored and unsupervised at the edge, or out of their depth in the middle of the group.</p>\n      <p><strong>Staffing and supervision:</strong> before a session begins, the head coach must confirm that the coaching team meets Empowr's required staffing ratio for that session. The ratio must consider the number of skaters as well as their ages, abilities, individual support needs and the risks within the planned activities. Meeting a numerical ratio does not automatically make a session safe—the team must also be positioned so that all skaters and relevant areas can be supervised.</p>\n      <p>A session must not begin—or must be adapted, restricted or cancelled—if safe supervision cannot be maintained. Assistant coaches must know which skaters, activities or areas they are responsible for supervising. The head coach retains overall responsibility for allocating the team and monitoring whether the arrangement remains safe.</p>\n    ",
    callout: "Narrate contact before you make it, and coach from where you can be seen. Both protect the skater—and protect you.",
    image: "/course/safeguarding-while-coaching-an-empowr-session.jpg",
    imageAlt: "Quad roller skates with a helmet, wrist guards, elbow pads and knee pads arranged in a sports hall",
    imageCaption: "Safe participation starts before anyone enters the rink.",
  },
  {
    kind: "content",
    slug: "safe-arrival-collection-and-venue-access",
    order: 10,
    label: "Arrival & collection",
    eyebrow: "10 of 20 · Before and after the session",
    title: "Safe arrival, collection and venue access",
    body: "\n      <p><strong>Arrival, drop-off and collection:</strong> children must be registered on arrival and released only in accordance with Empowr's collection procedures. Parents and carers must record how their child will leave the session through the Empowr Members portal.</p>\n      <p>Before the session ends, the head coach must review the register and know which children must be collected by a parent or authorised adult, which children have permission to leave independently, and whether any specific collection arrangements have been recorded.</p>\n      <p><strong>Arriving independently does not mean leaving independently:</strong> a child arriving at the venue by themselves does not automatically have permission to leave by themselves. The head coach must always follow the collection arrangement shown on the register.</p>\n      <p>If the register states that the child must be collected, they must remain supervised until their parent or authorised adult arrives—even if they travelled to the session alone. The parent or carer must update the collection arrangement through the Empowr Members portal before the child can leave independently. Verbal permission from the child is not sufficient.</p>\n      <p>Children must remain within Empowr's supervised collection area until they are collected or released in accordance with the information shown on the register. They must not be left unsupervised while waiting for a session to begin or after it ends.</p>\n      <p><strong>Changes to collection arrangements:</strong> verbal permission given at the venue does not replace the information held on the Empowr Members portal. If a parent or carer says their child may leave independently but the register says the child must be collected, the parent or carer must update the arrangement through their Members account before the child can be released.</p>\n      <p>The head coach must confirm that the updated permission appears on the register before allowing the child to leave independently. Coaches must not make informal exceptions or rely on a verbal message passed through the child.</p>\n      <p>If the Members portal or register cannot be accessed, or the updated information cannot be verified, the existing collection arrangement shown on the register must be followed. The child must remain supervised until the situation is resolved.</p>\n      <p>If a parent or authorised adult is late, the child must remain with the appropriate members of the team while Empowr's late-collection procedure is followed. A coach must never take a child home or make an informal collection arrangement directly with them.</p>\n      <p><strong>Role responsibility:</strong> the head coach is responsible for checking collection information and approving a child's release. Assistant coaches may support the collection process, but they must not independently approve a change or release a child contrary to the register. Any discrepancy must be referred to the head coach.</p>\n      <p><strong>If a child cannot be located:</strong> treat this as a safeguarding emergency and act immediately. Do not wait until the end of the session or assume that the child has gone home.</p>\n      <ul>\n        <li>Alert the head coach immediately and record the time the child was first noticed missing.</li>\n        <li>Stop all skating activities, bring the remaining children together in a safe supervised area and complete a headcount.</li>\n        <li>Check the register, collection information and whether the child has already been signed out or has permission to leave independently.</li>\n        <li>Keep the remaining children appropriately supervised throughout the response.</li>\n        <li>Check the immediate agreed areas, including toilets, entrances, seating and equipment areas and corridors. Ask authorised venue staff to assist where needed.</li>\n        <li>Monitor exits without locking or obstructing any emergency route.</li>\n        <li>Contact the child's parent or carer to confirm whether the child has been collected.</li>\n        <li>Call 999 immediately if the child may be in immediate danger, is particularly vulnerable, has left the venue or cannot be located following the initial checks. Inform the DSL as soon as possible, but do not delay an emergency call while seeking permission.</li>\n        <li>Record the complete timeline, checks undertaken, people contacted and the outcome. Ask the venue to preserve any relevant CCTV.</li>\n      </ul>\n      <p><strong>Who searches:</strong> the head coach coordinates the response, checks the register, assigns responsibilities and maintains oversight. Normally, an assistant coach should search the agreed areas with another suitable team member where staffing allows. At least one suitable coach must remain with the other children at all times.</p>\n      <p>If there are not enough Empowr team members to search without leaving the group inadequately supervised, the assistant coach must remain with the children and the head coach must request immediate assistance from authorised venue staff. Coaches must never leave the remaining children unsupervised.</p>\n      <p><strong>Staffing during a search:</strong> an assistant coach who leaves the skating space to search is no longer counted within the session's staffing ratio. Empowr's maximum supervision ratio is one coach to every 16 children. However, all skating must remain paused during a missing-child response, even if the number of remaining children is within this ratio.</p>\n      <p>Skating must not resume until the child has been located, the correct staffing ratio has been restored and the head coach is satisfied that it is safe to continue.</p>\n      <p><strong>When the child is found:</strong> notify everyone involved immediately and check the child's physical and emotional wellbeing without blaming, frightening or repeatedly questioning them. The child must remain supervised until they are safely collected or released according to the register. The incident must still be recorded and reviewed, even if the child was found quickly.</p>\n      <p><strong>Venue access and movement:</strong> safeguarding continues when skaters move away from the skating floor. Before the session starts, the head coach must agree how entrances, exits, seating areas, equipment areas and toilet access will be supervised.</p>\n      <p><strong>Late arrivals and secured access:</strong> parents and carers should arrive within the advertised registration period. Children must remain with their parent or carer until they have been registered and admitted by an Empowr team member.</p>\n      <p>External doors will normally be secured 15 minutes after the advertised session start time. Entry after this point is not guaranteed and is permitted only at the head coach's discretion.</p>\n      <p>Before admitting a late child, the head coach must confirm that the child has a booking and consider whether the correct staffing ratio can be maintained; whether someone can admit and register the child without leaving the skating space inadequately supervised; whether the child can receive any missed safety instructions and complete an appropriate warm-up; and whether the arrival can be managed without creating a risk or significant disruption.</p>\n      <p>Only a designated Empowr team member may respond to the door. Assistant coaches must not leave the skating floor to admit someone unless instructed by the head coach and sufficient supervision remains in place.</p>\n      <p>Doors must not be propped open or left unattended. Emergency exits must always remain operational and unobstructed. Unknown visitors must not be admitted without authorisation from the head coach or venue staff.</p>\n      <p>If the child cannot be admitted safely, the head coach may refuse late entry. The parent or carer remains responsible for the child and must not leave them outside, at reception or with an unauthorised person. Repeated late arrivals or significant access concerns should be recorded and referred to the appropriate Empowr lead.</p>\n      <p><strong>Managing an angry or aggressive parent:</strong> if a parent or carer becomes angry, aggressive or refuses to follow an Empowr safety decision, the head coach should manage the immediate situation while an assistant coach continues supervising the children.</p>\n      <p>Remain calm, use clear language and avoid arguing. Where safe, move the conversation away from the children while remaining visible to another team member. Do not discuss another child or family's information. Explain the relevant Empowr rule and the immediate action required. Safeguarding decisions—including those concerning PPE, collection arrangements, staffing, behaviour and participation—must not be changed because someone becomes confrontational.</p>\n      <ul>\n        <li>Give the parent an opportunity to calm down.</li>\n        <li>Ask another team member or venue representative to be present.</li>\n        <li>End the conversation if the behaviour continues or escalates.</li>\n        <li>Ask the person to leave if their behaviour is disrupting the session or frightening others.</li>\n        <li>Contact venue security or call the police if someone is threatened or in immediate danger.</li>\n        <li>Record what happened, including the behaviour observed, words used, witnesses and actions taken.</li>\n        <li>Report the incident to the Empowr Management Team and to the Empowr DSL where there is a safeguarding concern.</li>\n      </ul>\n      <p><strong>Complaints and follow-up decisions:</strong> coaches are not authorised to investigate or resolve complaints at the venue. If a parent wishes to complain, direct them to the contact page on Empowr's website for review by the Empowr Management Team.</p>\n      <p>Coaches must not promise a refund, credit, future attendance, policy exception or particular outcome. They should not debate the complaint during the session or communicate with the parent privately afterwards.</p>\n      <p>The Empowr Management Team responds to complaints and decides whether a warning, restriction, suspension or ban is appropriate. The coach manages the immediate safety of the session, records what happened and passes the information to management.</p>\n      <p>A coach may say: <em>\"I understand that you're unhappy with the decision. I'm not authorised to handle complaints at the session, but you can submit your concerns through the contact page on our website for the Empowr Management Team to review.\"</em></p>\n      <p>Children should follow Empowr's toilet procedure and change from skates into shoes before leaving the skating floor to use the toilet or go home.</p>\n    ",
    callout: "A child leaves only according to the current register. Arriving alone does not mean they may leave alone.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "additional-needs-medical-information-and-medication",
    order: 11,
    label: "Support & medication",
    eyebrow: "11 of 20 · Individual needs",
    title: "Additional needs, medical information and medication",
    body: "\n      <p><strong>SEND and additional support needs:</strong> Empowr welcomes conversations with parents and carers about a skater's additional needs. Coaches must not make assumptions based on a diagnosis, disability or behaviour. Each skater's needs, communication preferences, known triggers and helpful adjustments should be considered individually.</p>\n      <p>Empowr is not a specialist SEND provider and cannot automatically provide dedicated 1:1 support or a quiet space. Any additional support must be discussed and agreed before attendance so Empowr can decide whether the session can be delivered safely with the staffing, environment and resources available.</p>\n      <p>Assistant coaches must not independently promise additional support or adjustments. These arrangements must be reviewed and approved by the head coach or appropriate Empowr lead. If a child's needs cannot be safely met within the current provision, this must be explained respectfully and escalated through the appropriate process.</p>\n      <p><strong>Medical information:</strong> parents and carers must disclose relevant medical conditions, allergies, existing injuries, medication requirements and emergency contact information through the Empowr Members portal before their child attends. The head coach must review this information before the session and share it only with team members who need it to keep the child safe.</p>\n      <p><strong>Medication at Empowr:</strong> Empowr coaches and team members are not trained or authorised to administer medication to children. Parents and carers must not leave medication with a coach with the expectation that the coach will administer it.</p>\n      <p>Children who need medication during a session must be able to self-administer it safely. This arrangement must be disclosed in advance through the Empowr Members portal, together with relevant medical information and emergency instructions.</p>\n      <p>A coach may remind the child, observe them self-administering and help them access their medication. The coach must not select or measure a dose, prepare the medication, physically administer it or change the instructions provided.</p>\n      <p><strong>Younger children and additional support:</strong> if a child cannot safely self-administer their medication, their parent, carer or another appropriately trained and authorised adult must remain available to administer it. These arrangements must be agreed before the child is left at the session. Coaches must not make informal medication agreements with parents at the door.</p>\n      <p>Where the necessary support cannot be provided, the head coach must decide whether the child can attend safely. A booking does not require Empowr to provide medical support that its team is not trained or authorised to deliver.</p>\n      <p><strong>Emergency medication:</strong> inhalers, adrenaline auto-injectors and other emergency medication must remain with the child or in an agreed location that can be accessed immediately. The head coach must know where it is located but does not accept responsibility for administering it.</p>\n      <p>If a child experiences a medical emergency, call 999 immediately, alert the designated first aider and follow the emergency operator's instructions. Contact the parent or carer as soon as possible, but do not delay calling emergency services while trying to reach them. All medical emergencies and instances of medication being used during a session must be recorded.</p>\n    ",
    callout: "Empowr staff may support safe self-administration, but they are not trained or authorised to administer medication.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "stopping-sessions-managing-behaviour-and-evacuating",
    order: 12,
    label: "Safety decisions",
    eyebrow: "12 of 20 · Responding safely",
    title: "Stopping sessions, managing behaviour and evacuating",
    body: "\n      <p><strong>Stopping, adapting or cancelling a session:</strong> the head coach has the authority to pause, adapt or end a session whenever they believe it cannot continue safely. They do not need prior approval from management to take immediate action to protect skaters or the team.</p>\n      <p>Assistant coaches may immediately stop an activity they believe is unsafe. They must bring the group to a safe stop and inform the head coach, who will assess whether the activity or wider session can continue.</p>\n      <p><strong>Pause the session when:</strong></p>\n      <ul>\n        <li>A child cannot be located.</li>\n        <li>A serious injury or medical emergency occurs.</li>\n        <li>Supervision is temporarily disrupted.</li>\n        <li>An unauthorised person enters or attempts to enter.</li>\n        <li>Aggressive behaviour creates a risk.</li>\n        <li>An alarm sounds or the venue requires evacuation.</li>\n        <li>A new hazard is identified and needs to be assessed.</li>\n      </ul>\n      <p><strong>Adapt, restrict or cancel the session when:</strong></p>\n      <ul>\n        <li>The maximum ratio of one coach to 16 children cannot be maintained.</li>\n        <li>The available team cannot safely supervise the ages, abilities or additional needs present.</li>\n        <li>The designated first-aid or emergency arrangements are unavailable.</li>\n        <li>The floor, lighting, temperature, exits or other venue conditions are unsafe.</li>\n        <li>Required PPE or suitable quad skates are unavailable.</li>\n        <li>Equipment becomes damaged or unsafe.</li>\n        <li>A skater's behaviour continues to place themselves or others at risk.</li>\n        <li>Weather or surface conditions make an outdoor session unsafe.</li>\n        <li>A coach is unwell, impaired or otherwise unable to perform their role safely.</li>\n      </ul>\n      <p>Where possible, the head coach should consider whether the risk can be safely controlled by changing the activity, reducing the skating area, separating ability groups, removing unsafe equipment or keeping individual skaters off the rink.</p>\n      <p>If the risk cannot be adequately controlled, the session must not begin or continue. Attendance numbers, customer expectations or pressure to complete the session must never take priority over safety.</p>\n      <p>After stopping or cancelling a session, the head coach must supervise the safe collection or departure of skaters, record the reason for the decision and notify the Empowr Management Team. Coaches must not promise refunds, credits or replacement sessions. Financial and booking decisions are made by the management team.</p>\n      <p><strong>Managing unsafe or challenging behaviour:</strong> behaviour must be managed calmly, consistently and in a way that protects every skater's dignity. Coaches should consider whether fear, frustration, communication needs, sensory overload, additional needs or difficulty with the activity may be contributing to the behaviour.</p>\n      <p>Unsafe behaviour must not be ignored, but consequences must never be humiliating, threatening, physically punitive or designed to cause pain or exhaustion.</p>\n      <p>When behaviour creates a risk, coaches should:</p>\n      <ol>\n        <li>Use the agreed stop signal and bring the activity to a safe stop.</li>\n        <li>Give a clear, calm instruction explaining which behaviour must stop.</li>\n        <li>Ask the skater to move away from the immediate activity to a safe, supervised regulation area.</li>\n        <li>Allow them time to regulate and explain what happened.</li>\n        <li>Restate the safety rule and identify any suitable support or adjustment.</li>\n        <li>Allow them to rejoin only when the head coach is satisfied that it is safe.</li>\n        <li>End their participation if the unsafe behaviour continues or the risk cannot be controlled.</li>\n        <li>Contact the parent or carer and arrange safe collection where necessary.</li>\n        <li>Record significant or repeated incidents and report them to the Empowr Management Team.</li>\n      </ol>\n      <p><strong>Safe regulation area:</strong> the child must remain in the main hall and must not be taken into a separate room. Before the session begins, the head coach must identify a regulation area within the hall. This may be a bench, chair or marked space at the side of the hall that is away from moving skaters, equipment, doors and other hazards; visible to the coaching team; and positioned to provide some space without isolating the child.</p>\n      <p>The regulation area is not a punishment or a \"naughty corner.\" It is a safe place where a skater can remove their skates if needed, calm down, speak quietly with a coach and prepare to rejoin the activity.</p>\n      <p>The child must remain within sight and under supervision. A coach should not be alone and out of view with them, and supervising the child must not take the wider session below the required staffing ratio. Conversations should be handled quietly without discussing the child's behaviour in front of the group.</p>\n      <p>If the child refuses to use the area, coaches must not physically force them. The head coach should pause or redirect the group, reduce immediate hazards and give the child safe space while maintaining supervision. If the situation cannot be managed safely within the hall, contact the parent or carer to collect the child. If the child leaves the hall unexpectedly, alert the head coach immediately and follow the missing-child procedure where required.</p>\n      <p><strong>Physical intervention:</strong> Empowr coaches are not trained to restrain children and must not use physical restraint to manage behaviour. Physical contact must never be used to punish, intimidate, force compliance or remove a child simply because they are refusing an instruction.</p>\n      <p>In an immediate emergency, a coach may use the minimum necessary contact to prevent imminent harm—for example, stopping a child from skating into danger. Contact must stop as soon as the immediate danger has passed. Any emergency physical intervention must be reported to the head coach, recorded in detail and referred to the Empowr Management Team and Empowr DSL.</p>\n      <p>Coaches must never use punitive laps or drills, public humiliation, shouting or insulting language, threats concerning membership or future opportunities, withholding water, rest or toilet access, forced physical contact, or exclusion from supervision.</p>\n      <p>The head coach may end a skater's participation in the current session when necessary for safety. Coaches must not impose a future suspension or ban. Decisions affecting future attendance are made by the Empowr Management Team after reviewing the incident.</p>\n      <p><strong>Fire alarms and emergency evacuation:</strong> before every session, the head coach must confirm the venue's fire procedure, emergency exits and assembly point. Both the head coach and the person managing check-in must be able to access the live register. Emergency exits must remain unlocked, unobstructed and accessible, and equipment, bags and chairs must never restrict an evacuation route.</p>\n      <p>When an alarm sounds, stop the session immediately and direct everyone to the nearest safe exit. Skaters must not delay evacuation to collect belongings or change into shoes. Children wearing skates should move carefully, must not skate quickly towards the exit and may use a wall, barrier or other appropriate support where safe.</p>\n      <p>The head coach leads the response, maintains oversight and uses the register to account for the group. Assistant coaches guide and supervise the children as they leave, including anyone who needs additional support. A designated rear coach may follow behind the group, but must not delay evacuation or enter an unsafe area to search. Venue staff or the fire marshal remain responsible for the building-wide procedure.</p>\n      <p>At the assembly point, bring the group together and complete an immediate headcount against the register. Report anyone missing to the fire marshal or emergency services immediately. Coaches must not re-enter the building to search for someone or retrieve belongings.</p>\n      <p>Children must remain supervised at the assembly point and must not leave with a parent or carer until they have been accounted for and their departure has been confirmed through Empowr's collection process. Nobody may return to the building until venue staff or the emergency services confirm that it is safe.</p>\n      <p>Before the session, the head coach must identify any child who may require additional assistance to understand the alarm, move safely or reach the assembly point. Suitable arrangements must be agreed in advance with the parent, carer and venue. If the available team cannot safely meet the child's evacuation needs, the issue must be escalated before the session begins.</p>\n      <p>After an evacuation, the head coach must record any missing-person concern, injury, delay or difficulty and report it to the Empowr Management Team. The incident should be reviewed to identify any necessary changes to the venue layout, staffing plan or emergency procedure.</p>\n    ",
    callout: "When safety changes, stop first. Assess, adapt and resume only when the head coach is satisfied that it is safe.",
    image: "/course/stopping-sessions-managing-behaviour-and-evacuating.jpg",
    imageAlt: "A coach supporting a young skater in a visible regulation area within the same hall while another coach supervises the group",
    imageCaption: "Support should remain visible, supervised and within the main hall.",
  },
  {
    kind: "content",
    slug: "empowr-s-code-of-conduct-for-coaches",
    order: 13,
    label: "Code of conduct",
    eyebrow: "13 of 20 · Standards for deployment",
    title: "Empowr's code of conduct for coaches",
    body: "\n      <ul>\n        <li>Enhanced DBS with barred list check, renewed on Empowr's cycle, before any coaching deployment — no exceptions, including for cover or trial sessions.</li>\n        <li>Named coach-to-skater ratios for every session type (junior, all-ages, 1:1 technique coaching); lone working is only permitted where Empowr's lone-working policy specifically allows it.</li>\n        <li>All coach-skater communication runs through Empowr's official channels, copying a second adult or the DSL where a 1:1 conversation is needed.</li>\n        <li>Photography, filming and livestreaming follow the consent information for that specific session and use only Empowr-approved equipment, accounts and processes. Personal devices must not be used.</li>\n        <li>Transporting skaters requires two adults, parental consent, and follows Empowr's transport policy.</li>\n        <li>Coaches keep a brief written note of any 1:1 time, injury, or notable incident — even where nothing was wrong — as standard record-keeping.</li>\n      </ul>\n    ",
    callout: "As a coach, you model this code for volunteers and juniors around you. What you normalise, others will too.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "safeguarding-adults-at-risk",
    order: 14,
    label: "Adults at risk",
    eyebrow: "14 of 20 · All ages",
    title: "Safeguarding adults at risk",
    body: "\n      <p>An \"adult at risk\" is someone over 18 who may be less able to protect themselves from harm or exploitation because of a disability, illness, age, or personal circumstance.</p>\n      <p>Empowr's all-ages and adult sessions carry the same duty of care — the coaching relationship still holds power, and the same standards around contact, communication, and 1:1 time apply.</p>\n      <p>Signs of harm in an adult at risk can include unexplained withdrawal, unexplained injuries or money worries, or a support worker or carer who won't leave them alone with you.</p>\n      <p>The reporting route is the same as for a child: raise it with the Empowr DSL, or with adult social care or the police in an emergency.</p>\n    ",
    callout: "Capacity and vulnerability can be situational — someone who seems confident in one context may be at risk in another. When in doubt, apply the same standard of care as you would for a child.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "digital-safety-for-coaches",
    order: 15,
    label: "Digital safety",
    eyebrow: "15 of 20 · Online",
    title: "Digital safety for coaches",
    body: "\n      <ul>\n        <li>Never add a skater under 18 as a personal contact on your own social media, and never message a young skater 1:1 outside Empowr's official channels.</li>\n        <li>Squad or session group chats should include a second adult, follow Empowr's naming and branding, and stay focused on session logistics.</li>\n        <li>Livestreaming or recording sessions follows the same consent rules as photography — check the register first.</li>\n        <li>If a skater contacts you online in a way that concerns you, preserve the message, don't continue a 1:1 conversation, and pass it directly to the Empowr DSL.</li>\n      </ul>\n    ",
    callout: "If you wouldn't want a message shown to the Empowr DSL, don't send it.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "recognising-responding-to-and-recording-a-disclosure",
    order: 16,
    label: "Disclosures",
    eyebrow: "16 of 20 · Disclosures",
    title: "Recognising, responding to, and recording a disclosure",
    body: "\n      <p>Signs can be physical (injuries, exhaustion), behavioural (withdrawal, aggression, regression, sudden changes), or direct — a skater tells you, or tells someone who tells you.</p>\n      <p>In the moment: stay calm, don't show shock or disgust, don't promise confidentiality, and don't ask leading questions (\"did he touch you?\") — ask open ones (\"can you tell me what happened?\").</p>\n      <p>Listen without interrupting and allow the person to speak at their own pace. Reassure them that they have done the right thing by telling you, but do not promise secrecy or tell them that everything will be all right.</p>\n      <p>Ask only enough open questions to clarify what they are telling you. Do not investigate, repeatedly question them, approach the person involved, or ask other people whether the account is true.</p>\n      <p>Explain what will happen next in simple, age-appropriate language: you will share the information only with the people who need to help keep them safe. Report the concern to the DSL as soon as possible. If someone is in immediate danger, call 999 first.</p>\n      <p>It's normal to feel affected yourself. Manage your own reaction after the conversation, not during it, and speak to the Empowr DSL if you need support.</p>\n      <p>Record what was said as soon as possible, in the skater's own words where you can, noting the date, time, location, who was present, and exactly what you did next. Don't leave gaps to \"fill in later.\"</p>\n    ",
    callout: "Your account, written soon and in the skater's words, may become an important record later. Write it like it matters — because it might.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "reporting-pathways-including-concerns-about-a-colleague",
    order: 17,
    label: "Reporting",
    eyebrow: "17 of 20 · Take action",
    title: "Reporting pathways — including concerns about a colleague",
    body: "\n      <p>Your first point of contact for almost every concern is the <strong>Empowr DSL</strong>. All written safeguarding reports must be emailed to <strong>safeguarding@empowrcic.org</strong>. Coaches must not use personal email addresses, WhatsApp groups, social media or informal messages to report or store confidential safeguarding information.</p>\n      <p>For an urgent concern, contact the DSL, Empowr Management Team or emergency services first, then submit the written email record as soon as possible. Sending an email must never delay immediate action.</p>\n      <p>Use the subject line: <strong>CONFIDENTIAL SAFEGUARDING CONCERN – [session and date]</strong>. Do not include the child's full name, medical information or other sensitive details in the subject line.</p>\n      <p>The email should include the date, time and location; the skater's full name within the email; the names and roles of people present; exactly what was seen, heard or disclosed; the person's own words where possible; actions taken; people contacted; whether the concern remains urgent; and the reporting coach's name and role.</p>\n      <p><strong>Confidentiality and information sharing:</strong> safeguarding, medical and personal information must be shared only with people who need it to protect the skater or manage the concern. Confidentiality does not mean keeping a safeguarding concern secret.</p>\n      <p>Coaches must not discuss a child or family in front of other skaters or parents; share safeguarding information in general team chats; keep safeguarding records on personal devices; send Members portal screenshots to unauthorised people; discuss a concern socially; or tell the person named in a concern before receiving safeguarding guidance.</p>\n      <p>Send reports only to authorised recipients and do not copy in people merely to keep them informed. Attach photographs, screenshots or other evidence only when relevant and safe to do so, and do not retain unnecessary copies on personal devices.</p>\n      <p>The coach should receive confirmation that the report has been received. If an urgent report is not acknowledged promptly, follow it up directly and escalate through Empowr's alternative reporting route where necessary. If confidential information is accidentally sent to the wrong person, notify the Empowr Management Team immediately and do not try to conceal or resolve the data breach alone.</p>\n      <p>If a skater is in immediate danger, call <strong>999</strong> first, then inform the Empowr DSL as soon as it is safe.</p>\n      <p>If your concern is about another coach or volunteer's behaviour—not just a skater's welfare—report it in the same way. The Empowr DSL, not the reporting coach, decides what happens next, including whether the matter needs to be referred to Lewisham Council's Local Authority Designated Officer (LADO) or the police.</p>\n      <p><strong>If the concern involves the Empowr DSL:</strong> report it immediately to the Empowr Management Team through Empowr's official contact page. Individual management team members do not need to be named, but the official reporting route must be used.</p>\n      <p>The report must be handled by a management team member who is not named in, connected to or otherwise conflicted by the concern. Anyone involved in the concern must not access, assess or manage that report.</p>\n      <p>If the concern involves the management team, cannot be handled independently, is not acknowledged or is not acted upon, the coach must escalate it to Lewisham Council's LADO, children's social care or the police, as appropriate.</p>\n      <p>Record facts rather than assumptions; preserve relevant messages, images or records; do not confront the person involved; and share the information only with those who need to know. Never delay reporting because the person involved is senior, experienced, well-liked or connected to Empowr.</p>\n      <p>Raising a concern about a colleague can feel uncomfortable. Empowr's policy protects anyone who raises a concern in good faith, even if it turns out to be unfounded — this is often called whistleblowing protection.</p>\n      <p>Records of a concern, however it's resolved, are kept securely by Empowr for the period set out in its safeguarding policy.</p>\n    ",
    callout: "<strong>Safeguarding email:</strong> safeguarding@empowrcic.org<br><strong>Management reporting route:</strong> Empowr website contact page<br><strong>Lewisham Council LADO:</strong> LewishamLADO@lewisham.gov.uk · 020 8314 3306<br><strong>Emergency:</strong> 999<br><br>A concern about a colleague is still a concern. Raise it, don't investigate it, and don't sit on it.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "content",
    slug: "keeping-your-safeguarding-practice-current",
    order: 18,
    label: "Keeping current",
    eyebrow: "18 of 20 · Continuing competence",
    title: "Keeping your safeguarding practice current",
    body: "\n      <p>Completing this course confirms that a coach has met Empowr's safeguarding learning requirement at the time of completion. It does not replace the need to follow updated policies or demonstrate safe practice during sessions.</p>\n      <p>Coaches must renew the full Empowr safeguarding course every three years.</p>\n      <p>Additional training may be required before the three-year renewal date whenever legislation, safeguarding guidance, Empowr procedures or the coach's responsibilities change.</p>\n      <p>Empowr may also require refresher or remedial training following a safeguarding incident, an identified gap in practice or an extended break from coaching.</p>\n      <p>The head coach and Empowr Management Team may monitor whether coaches maintain safe supervision, follow PPE and collection procedures, use appropriate language and professional boundaries, respond correctly to concerns and complete accurate records.</p>\n      <p>If a coach does not meet the required standard, Empowr may provide feedback, additional supervision, refresher training or a development plan. A coach may be removed temporarily from coaching duties where their practice creates a risk or further training is required. Serious, repeated or deliberate breaches may be managed through Empowr's disciplinary and safeguarding procedures.</p>\n    ",
    callout: "Safeguarding competence is demonstrated through conduct as well as course completion. A valid certificate does not guarantee continued deployment if a coach is not following Empowr's standards.",
    image: null,
    imageAlt: null,
    imageCaption: null,
  },
  {
    kind: "scenario",
    slug: "three-situations-you-might-face",
    order: 19,
    label: "Scenarios",
    eyebrow: "19 of 20 · Working through it",
    title: "Three situations you might face",
    scenarios: [
      {
        prompt: "A 16-year-old on your squad asks to follow you on Instagram after a great session.",
        options: [
          { text: "Accept — it seems harmless since they're 16", recommended: false, feedback: "Not recommended. Personal social media connections with skaters fall outside Empowr's official channels, whatever the skater's age." },
          { text: "Decline warmly, explain Empowr's policy, and point them to the official squad account", recommended: true, feedback: "Recommended. This keeps the boundary clear while still giving them a way to stay connected." },
          { text: "Ignore the request and hope they forget", recommended: false, feedback: "Not recommended. An unexplained silence can feel like rejection — a warm, clear explanation is kinder and clearer." },
        ],
      },
      {
        prompt: "A parent mentions their child seems more withdrawn lately, and asks you to keep an eye on them without making a big deal of it.",
        options: [
          { text: "Agree to keep an eye on it, and leave it there since nothing's confirmed", recommended: false, feedback: "Not recommended. Observing is right, but not writing anything down risks losing the detail that matters later." },
          { text: "Thank the parent, record what they said, inform the Empowr DSL and continue appropriate observation", recommended: true, feedback: "Recommended. This creates a prompt record, ensures the concern reaches the right person and allows appropriate observation without promising secrecy." },
          { text: "Question the child immediately until they explain why they seem withdrawn", recommended: false, feedback: "Not recommended. Do not investigate or pressure the child. Record the information and seek guidance from the Empowr DSL." },
        ],
      },
      {
        prompt: "You notice a fellow assistant coach regularly keeps one skater back after sessions for \"extra practice,\" alone, off the published schedule.",
        options: [
          { text: "Say nothing—you don't want to accuse a colleague without proof", recommended: false, feedback: "Not recommended. You don't need proof to report an observation; the Empowr DSL assesses what happens next." },
          { text: "Describe exactly what you've observed to the Empowr DSL", recommended: true, feedback: "Recommended. This is the correct route for a concern about a colleague and is protected under Empowr's whistleblowing policy." },
          { text: "Confront the coach directly yourself first", recommended: false, feedback: "Not recommended. Do not investigate or confront the person yourself; this can compromise how the concern is managed." },
        ],
      },
    ],
  },
  {
    kind: "reflection",
    slug: "reflect-on-your-practice",
    order: 20,
    label: "Reflect",
    eyebrow: "20 of 20 · Before you finish",
    title: "Reflect on your practice",
    prompt: "In your own words, note one change you'll make to your coaching practice as a result of this course.",
    placeholder: "Write a sentence or two — this is for you, not marked.",
  },
];

export const courseModuleBySlug = new Map(courseModules.map((m) => [m.slug, m]));

/** Percentage needed to pass. The handover states 80% three times; the
 *  mock-up's 85% is superseded. */
export const PASS_MARK = 80;

/** Question text and options only. The correct answers deliberately live in
 *  safeguarding-answers.ts, which is server-only — shipping them here would put
 *  the entire answer key in the browser bundle for anyone to read. */
export interface AssessmentQuestion {
  readonly id: number;
  readonly question: string;
  readonly options: readonly string[];
}

export const assessmentQuestions: readonly AssessmentQuestion[] = [
  { id: 0, question: "What does \"Minimum Deployment Requirement\" mean?", options: ["An optional extra for senior coaches", "The baseline every coach must meet before being deployed", "A requirement only for head coaches", "A one-off induction with no renewal"] },
  { id: 1, question: "Which statement about a Junior Assistant Coach is correct?", options: ["They may lead a session alone once they feel confident", "They may count within the ratio but must remain under the direct supervision of a named adult coach at all times", "They need adult supervision only during their first few sessions", "They may search for a missing child alone if the head coach gives permission"] },
  { id: 2, question: "Which DBS check level does Empowr require for coaching roles?", options: ["Basic check only", "Enhanced check with barred list check", "No check needed if a parent is present", "Enhanced check without barred list"] },
  { id: 3, question: "Which of these is a sign of possible grooming behaviour?", options: ["A coach treating all skaters consistently", "A coach giving one skater unusual attention, gifts, or exceptions", "A coach following Empowr's ratio policy", "A coach recording 1:1 time as required"] },
  { id: 4, question: "What does being \"child-centred\" mean day-to-day?", options: ["Prioritising performance results above all else", "Putting the skater's welfare and voice at the centre of coaching decisions", "Making decisions without needing skater input", "Treating every skater identically regardless of need"] },
  { id: 5, question: "Where should 1:1 technique coaching happen, per Empowr's code of conduct?", options: ["Anywhere convenient, as long as it's brief", "Off-site, to reduce distractions", "Where others can see and hear, with a reason recorded", "Only after other skaters go home"] },
  { id: 6, question: "A 16-year-old asks to add you on personal social media. What should you do?", options: ["Accept, since you already coach them", "Decline and explain Empowr's official channels policy", "Accept but mute notifications", "Ask a parent for permission first, then accept"] },
  { id: 7, question: "What is an \"adult at risk\"?", options: ["Anyone over the age of 60", "An adult who may be less able to protect themselves from harm due to disability, illness, age or circumstance", "Only adults with a diagnosed disability", "A term that doesn't apply to Empowr's sessions"] },
  { id: 8, question: "When responding to a disclosure, which of these should you avoid?", options: ["Asking open questions like \"can you tell me what happened?\"", "Staying calm", "Promising to keep it a secret", "Recording what was said soon afterwards"] },
  { id: 9, question: "What should you write down after a skater discloses something to you?", options: ["A summary written a week later once you've had time to think", "The skater's own words, with date, time, location and who was present, recorded as soon as possible", "Only the parts you're certain are true", "Nothing — a verbal report to the DSL is enough"] },
  { id: 10, question: "You notice a colleague regularly keeping one skater back alone off-schedule. What's the right first step?", options: ["Say nothing without proof", "Confront the colleague directly yourself", "Describe exactly what you've observed to the Empowr DSL", "Post about it in the group chat to see if others noticed"] },
  { id: 11, question: "What does whistleblowing protection mean under Empowr's policy?", options: ["You're protected from consequences for raising a concern in good faith, even if it turns out unfounded", "Only head coaches can raise concerns about colleagues", "You must have proof before raising a concern", "Concerns about colleagues bypass the DSL and go straight to police"] },
  { id: 12, question: "What is Empowr's protective gear policy for skaters under 15?", options: ["Helmet only is required, pads are optional", "Full protective gear—a fitted and fastened helmet, wrist guards, elbow pads and knee pads—is required with no exceptions", "Gear is required only for competitions, not regular sessions", "Gear is left to the parent's discretion"] },
  { id: 13, question: "A skater aged 15 or over chooses not to wear pads, but you notice them skating in a way that risks injury. What should you do?", options: ["Respect their choice regardless of the risk", "Advise them once, then leave it to them", "Step in, adapt or stop the activity, and require protective gear where appropriate", "Ignore it unless they fall"] },
  { id: 14, question: "A skater falls and may be injured. Who leads the on-site first-aid response?", options: ["Any coach on duty", "The session's designated first aider", "The skater's parent", "The head coach, regardless of training"] },
  { id: 15, question: "A child arrived alone, but the register says they must be collected. What should happen?", options: ["Let them leave because they arrived independently", "Ask the child whether their parent allows it", "Keep them supervised until collection or until a parent updates the Members portal and the head coach verifies it", "Accept a verbal message passed through another child"] },
  { id: 16, question: "An assistant coach leaves the hall to search for a missing child. What happens to the skating session?", options: ["It continues if fewer than 16 children remain", "It continues at a slower pace", "All skating pauses until the child is located, staffing is restored and the head coach confirms it is safe", "The children decide whether they feel safe to continue"] },
  { id: 17, question: "A young child needs medication but cannot self-administer it. What is Empowr's position?", options: ["Any coach may administer it", "The head coach administers it", "A parent, carer or appropriately trained authorised adult must remain available; Empowr coaches do not administer medication", "Another child may help them"] },
  { id: 18, question: "A parent wants to make a complaint during a session. What should the coach do?", options: ["Promise a refund to calm them down", "Investigate the complaint at the venue", "Direct them to Empowr's website contact page for the Management Team to review", "Continue the discussion privately after the session"] },
  { id: 19, question: "The fire alarm sounds while children are wearing skates. What should they do?", options: ["Change into shoes before leaving", "Collect their belongings first", "Evacuate immediately and move carefully without delaying to change shoes", "Wait inside for a parent"] },
  { id: 20, question: "How often must coaches renew the full Empowr safeguarding course?", options: ["Every year", "Every two years", "Every three years, with additional training sooner when required", "Only once"] },
  { id: 21, question: "If a skater is in immediate danger, what's your first action?", options: ["Call the Empowr DSL", "Call 999", "Write up a report first", "Speak to the skater's parents"] },
];
