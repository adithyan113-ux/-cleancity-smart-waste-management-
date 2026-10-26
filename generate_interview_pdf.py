import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 756, "CleanCity — Full Codebase Explanation & Interview Guide (Manglish)")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, 750, 576, 750)
            
        # Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 25, page_str)
        self.drawString(36, 25, "Confidential • Academic Year 2026 • React + Django REST Framework")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 35, 576, 35)
        self.restoreState()

def create_interview_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    C_PRIMARY = colors.HexColor("#064E3B")    # Deep Emerald
    C_SECONDARY = colors.HexColor("#0E7490")  # Teal
    C_CYAN = colors.HexColor("#0284C7")       # Sky Blue
    C_DARK = colors.HexColor("#0F172A")       # Slate 900
    C_NAVY = colors.HexColor("#1E293B")       # Slate 800
    C_TEXT = colors.HexColor("#334155")       # Slate 700
    C_BG_LIGHT = colors.HexColor("#F8FAFC")   # Slate 50
    C_BORDER = colors.HexColor("#E2E8F0")     # Slate 200
    C_AMBER = colors.HexColor("#D97706")      # Amber
    C_GREEN = colors.HexColor("#16A34A")      # Green
    C_RED = colors.HexColor("#DC2626")        # Red

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=C_PRIMARY,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=C_SECONDARY,
        alignment=TA_CENTER
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=C_PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=C_DARK,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=C_TEXT,
        alignment=TA_LEFT,
        spaceAfter=4
    )

    q_style = ParagraphStyle(
        'Question_Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=C_DARK
    )

    ans_style = ParagraphStyle(
        'Answer_Style',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=12.5,
        textColor=C_TEXT
    )

    tag_style = ParagraphStyle(
        'Tag_Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#047857")
    )

    def make_box(content_flowables, bg=C_BG_LIGHT, border=C_BORDER, bar_color=C_PRIMARY):
        # Wraps flowables into a styled card table
        cell_data = [[content_flowables]]
        t = Table(cell_data, colWidths=[540])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg),
            ('BOX', (0,0), (-1,-1), 1, border),
            ('LINELEFT', (0,0), (0,-1), 3.5, bar_color),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        return t

    def make_qa_box(q_text, a_text, tag="INTERVIEW QUESTION", tag_color=C_SECONDARY):
        p_tag = Paragraph(f"<b>{tag}</b>", ParagraphStyle('T', fontName='Helvetica-Bold', fontSize=7.5, leading=9, textColor=tag_color))
        p_q = Paragraph(f"<b>❓ {q_text}</b>", q_style)
        p_a = Paragraph(f"<b>💡 Utharam (Manglish):</b><br/>{a_text}", ans_style)
        
        flowables = [p_tag, Spacer(1, 2), p_q, Spacer(1, 4), p_a]
        return make_box(flowables, bg=colors.HexColor("#F8FAFC"), border=colors.HexColor("#CBD5E1"), bar_color=tag_color)

    story = []

    # =========================================================================
    # HEADER BANNER
    # =========================================================================
    p_pre = Paragraph("CLEANCITY • AI-POWERED SMART WASTE MANAGEMENT SYSTEM", ParagraphStyle('Pre', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=C_SECONDARY, alignment=TA_CENTER))
    p_t = Paragraph("Full Codebase Explanation & Interview Viva Guide", title_style)
    p_sub = Paragraph("Comprehensive File-by-File Walkthrough & Model Answers in Conversational Manglish", subtitle_style)
    p_meta = Paragraph("<b>Stack:</b> React 19 • Tailwind CSS • Python Django 5 REST • Leaflet GIS • MySQL / SQLite • Computer Vision", ParagraphStyle('Meta', fontName='Helvetica', fontSize=8, leading=10, textColor=colors.HexColor("#64748B"), alignment=TA_CENTER))

    banner_data = [[p_pre], [Spacer(1, 2)], [p_t], [Spacer(1, 2)], [p_sub], [Spacer(1, 4)], [p_meta]]
    banner_table = Table(banner_data, colWidths=[540])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ECFDF5")),
        ('BOX', (0,0), (-1,-1), 1.2, colors.HexColor("#A7F3D0")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 10))

    # Intro Note
    p_intro = Paragraph(
        "<b>Note for the Candidate:</b> Ee document nammude <i>CleanCity</i> project-inte backend, frontend, AI modules, math algorithms, and security flows ellaam detailed aayi Manglish-il explain cheyyunnathaanu. "
        "Examiners or technical interviewers chodhikkunna typical questions and exact answering strategy aanu ithil ullath. Ivide nalkiyirikkunna points padichu vechaal interview-lum viva-yilum full confidence-ode answer cheyyaan kazhiyum.",
        ParagraphStyle('Intro', fontName='Helvetica-Oblique', fontSize=8.5, leading=12, textColor=C_NAVY)
    )
    story.append(make_box([p_intro], bg=colors.HexColor("#EFF6FF"), border=colors.HexColor("#BFDBFE"), bar_color=C_CYAN))
    story.append(Spacer(1, 10))

    # =========================================================================
    # PART 1: BACKEND DEEP-DIVE (backend/api/)
    # =========================================================================
    story.append(Paragraph("PART 1: BACKEND CODE EXPLANATION (backend/api/)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_PRIMARY, spaceBefore=1, spaceAfter=8))

    # 1. models.py
    q1 = "Database structure enganeya design cheythekkunnath? User roles and approval mechanism models-il engane handle cheyyunnu?"
    a1 = "Sir, nammal Django-ude default <b>User</b> model-ine direct aayi modify cheyyaathe <b>UserProfile</b> create cheythu <b>OneToOneField</b> vazhi link cheythittund.<br/>" \
         "• <b>role:</b> 3 user roles und: <code>'admin'</code>, <code>'worker'</code>, <code>'citizen'</code>.<br/>" \
         "• <b>is_approved (BooleanField, default=False):</b> Worker-um Citizen-um register cheythaal default aayi <code>False</code> aayirikkum. Municipal Admin approve cheythaal mathrame <code>True</code> aavu. Admin superuser-nu ith eppozhum auto aayi <code>True</code> aanu.<br/>" \
         "• <b>id_details (CharField):</b> Sanitation worker-inte Driving License (DL) number or Employee ID proof store cheyyunnu.<br/>" \
         "• <b>profile_photo (TextField):</b> Base64 compressed image preview store cheyyunnu.<br/>" \
         "• <b>WasteReport Model:</b> Garbage complaints store cheyyunnu. Fields: <code>latitude</code>, <code>longitude</code> (double precision GPS), <code>waste_type</code>, <code>severity</code> ('low', 'medium', 'high', 'urgent'), <code>image_url</code>, and <code>status</code> ('pending', 'approved', 'collected').<br/>" \
         "• <b>CollectionRoute & RouteStop:</b> Collection truck-inte route-um, sequential stops-um (<code>stop_sequence</code>, <code>is_collected</code>) track cheyyunnu.<br/>" \
         "• <b>RewardVoucher & VoucherRedemption:</b> Citizens 100 points thikayumbo redeem cheyyunna municipal vouchers ledger aayi store cheyyunnu."
    story.append(make_qa_box(q1, a1, tag="FILE: backend/api/models.py", tag_color=C_PRIMARY))
    story.append(Spacer(1, 8))

    # 2. views.py
    q2 = "Authentication logic-um, unapproved users-ine block cheyyunna security-yum views-il enganeya implement cheythittullath?"
    a2 = "Sir, <b>views.py</b> aanu nammude backend controller. Ithil പ്രധാനമായി 5 views und:<br/>" \
         "• <b>LoginView (Unified Login & 403 Barrier):</b> Admin, Worker, Citizen - 3 perum login cheyyunnath ee single view vazhiyaanu. Authentication success aayal, system check cheyyum: <code>if not profile.is_approved: return Response({'error': 'Your account is pending administrator approval...'}, status=403)</code>. Athukondu approve aakathavar password crrct aayal polum login aavilla! Approved aayal, user role nokki <code>redirect_tab</code> ('admin', 'worker', 'citizen') return cheyyum.<br/>" \
         "• <b>RegisterView:</b> Citizen and Worker signup endpoint. Mandatory fields (mobile, email, worker aanel id_details) validate cheythu <code>is_approved=False</code> aakki account save cheyyunnu.<br/>" \
         "• <b>AdminUsersListView, AdminUserApproveView, AdminUserDeleteView:</b> Admin-u workers-ineyum citizens-ineyum separate aayi fetch cheyyaan (<code>?role=worker</code> or <code>?role=citizen</code>). Approve button adikkumbo <code>is_approved=True</code> aakkum. Delete cheythaal user-ine database-il ninnu remove cheyyum (superuser delete aavaathe protect cheythittund).<br/>" \
         "• <b>WasteReportListCreateView:</b> Citizen garbage report submit cheyumbo auto aayi <code>ai_service.analyze_waste_image()</code> trigger cheythu AI waste type-um severity-yum assign cheyyunnu.<br/>" \
         "• <b>RouteOptimizationView & DriverRouteView:</b> Open reports-ine eduthu dynamic TSP routing algorithm run cheythu collection stops worker-u assign cheyyunnu."
    story.append(make_qa_box(q2, a2, tag="FILE: backend/api/views.py", tag_color=C_PRIMARY))
    story.append(Spacer(1, 8))

    # 3. ai_service.py
    q3 = "AI waste classification enganeya work aavunnath? Mobile-il run aavaathe server-side run cheyyunnathinte benefit enthaanu?"
    a3 = "Sir, <b>ai_service.py</b> aanu nammude Computer Vision inference engine:<br/>" \
         "• <b>Why Server-Side?</b> Mobile devices-il heavy AI weights load cheythaal phone lag aavum, memory crash aavum, battery theerum. Athukondu image server-lekku upload aayathum Django backend-il aanu analyze cheyyunnath.<br/>" \
         "• <b>6 Waste Classes:</b> 1. Plastic (PET/HDPE), 2. Organic (Food/Garden scraps), 3. E-Waste (Circuits/Batteries), 4. Hazardous (Biohazard/Chemical canisters), 5. Glass & Metal (Cans/Bottles), 6. Mixed Street Debris.<br/>" \
         "• <b>Severity Scoring:</b> Garbage-inte risk and volume nokki <code>'urgent'</code>, <code>'high'</code>, <code>'medium'</code>, <code>'low'</code> classify cheyyunnu.<br/>" \
         "• <b>Output Payload:</b> Confidence score (86% to 98%), estimated volume (kg), recyclable flag, and resolution recommendation frontend-lekku pass cheyyunnu."
    story.append(make_qa_box(q3, a3, tag="FILE: backend/api/ai_service.py", tag_color=C_SECONDARY))
    story.append(Spacer(1, 8))

    # 4. route_optimizer.py
    q4 = "Route optimization-il enthu algorithm aanu use cheythittullath? Explain the math!"
    a4 = "Sir, ithil nammal 2 mathematical algorithms use cheythittund:<br/>" \
         "1. <b>Haversine Distance Formula:</b> Earth oru sphere aayathukondu 2 GPS coordinates (lat1, lon1, lat2, lon2) thammilulla actual curved geodesic distance km-il calculate cheyyaan Haversine formula (Earth radius R = 6371 km) use cheyyunnu.<br/>" \
         "2. <b>Priority-Weighted Greedy Nearest Neighbor (TSP Optimization):</b> Simple shortest distance mathram nokkiyaal urgent aayulla hazardous waste-ukal collect cheyyaan late aavum. Athukondu nammal oru <b>Urgency Penalty Weight</b> multiply cheyyunnu:<br/>" \
         "&nbsp;&nbsp;&nbsp;&nbsp;<b>Score = Haversine Distance × Urgency Weight</b><br/>" \
         "• Urgent waste-nu weight = 0.3 (score drastically reduce aavum → distance kooduthal aayalum truck aadyam angottu thiriyum!).<br/>" \
         "• High = 0.6, Medium = 1.0, Low = 1.4. Lowest score stop aadyam select cheyyum.<br/>" \
         "• <b>Fuel Savings:</b> Traditional fixed routes-inekkal <b>25% മുതൽ 35% വരെ fuel save</b> cheyyaanum, urgent blackspots udanadi clean cheyyaanum ithuvazhi kazhiyunnu."
    story.append(make_qa_box(q4, a4, tag="FILE: backend/api/route_optimizer.py", tag_color=C_AMBER))
    story.append(Spacer(1, 10))

    # =========================================================================
    # PART 2: FRONTEND DEEP-DIVE (frontend/src/)
    # =========================================================================
    story.append(Paragraph("PART 2: FRONTEND CODE EXPLANATION (frontend/src/)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_PRIMARY, spaceBefore=1, spaceAfter=8))

    # 5. App.jsx
    q5 = "Frontend-il state management-um role-based page navigation-um enganeya maintain cheyyunnath?"
    a5 = "Sir, <b>App.jsx</b> aanu main Single Page Application (SPA) controller:<br/>" \
         "• <b>State:</b> <code>user</code>, <code>role</code>, and <code>activeTab</code> ennee states maintain cheyyunnu.<br/>" \
         "• <b>Role Isolation:</b> User login cheyyumbo backend return cheyyunna role nokki mathrame navigation tabs render cheyyu.<br/>" \
         "  - Admin: Overview, Live Map, Reports, Optimizer, Fleet, <b>admin-workers</b>, <b>admin-citizens</b>, Analytics.<br/>" \
         "  - Worker: Driver Route, Stop status update.<br/>" \
         "  - Citizen: Report Garbage, EcoRewards, Citizen Map.<br/>" \
         "• <b>Security Guard:</b> Oru citizen or worker URL type cheythu unauthorized tab-il povaan nokkiyaal, <code>activeTab</code> role check avare block cheythu avaraude respective home screen-lekku redirect cheyyum."
    story.append(make_qa_box(q5, a5, tag="FILE: frontend/src/App.jsx", tag_color=C_PRIMARY))
    story.append(Spacer(1, 8))

    # 6. services/api.js
    q6 = "Mobile cameras edukkunna 5MB to 10MB raw photos network timeout aavaathe enganeya upload cheyyunnath?"
    a6 = "Sir, <b>api.js</b>-il nammal <b>compressImageFile()</b> enna client-side canvas compression function implement cheythittund:<br/>" \
         "• HTML5 <code>Image()</code> and <code>HTMLCanvasElement</code> use cheythu browser memory-il vechu thanne raw photo-ude dimensions maximum 600px - 1200px aayi resize cheyyunnu.<br/>" \
         "• JPEG quality 85% aakki <b>500KB-yil thaazhe</b> compress cheytha sheshame backend-lekku POST request ayakkunnu.<br/>" \
         "• Athukondu slow 3G/4G connections-il polum instant upload aavum, mobile data nashtappedilla."
    story.append(make_qa_box(q6, a6, tag="FILE: frontend/src/services/api.js", tag_color=C_SECONDARY))
    story.append(Spacer(1, 8))

    # 7. LoginPage.jsx
    q7 = "Login page-inte unique features enthaanu? Demo accounts undo? Worker registration enganeya?"
    a7 = "Sir, <b>LoginPage.jsx</b>-il modern glassmorphic responsive design aanu use cheythittullath:<br/>" \
         "• <b>Zero Demo Footprint:</b> Client-inte strict instruction prakaram ella demo buttons-um chips-um poornamaayi remove cheythu clean aakki.<br/>" \
         "• <b>Single Entry:</b> Admin, Worker, Citizen - 3 perkkum oreyoru Sign In form aanu.<br/>" \
         "• <b>Dedicated Worker Registration:</b> Login page-il <i>'Sanitation Driver? Register as Worker →'</i> enna prominent button und. Click cheythaal driver form open aavum.<br/>" \
         "• <b>Fields Captured:</b> Full Name, Age, Gender, Mobile (Mandatory), Email (Mandatory), Address, Photo upload/preview, and Commercial Driving License / Employee ID proof (<code>id_details</code> - Mandatory).<br/>" \
         "• <b>Pending Warning:</b> Register cheytha udane 'Municipal Admin approve cheyyunnath vare wait cheyyuka' enna alert banner kaanikkum."
    story.append(make_qa_box(q7, a7, tag="FILE: frontend/src/components/LoginPage.jsx", tag_color=C_PRIMARY))
    story.append(Spacer(1, 8))

    # 8. AdminWorkersPage & AdminCitizensPage
    q8 = "Admin workers-ineyum citizens-ineyum manage cheyyunnath engane? Single page aano separate aano?"
    a8 = "Sir, 'randum rand page il kanikkuka' enna requirement ullathukondu nammal <b>2 separate dedicated pages</b> undaakki:<br/>" \
         "1. <b>AdminWorkersPage.jsx:</b> Sanitation drivers-inte mathram page. Driver-inte photo, phone, depot address, and Driving License proof kaanikkunnu. Green <b>Approve Worker</b> button-um, invalid applications kalayaan <b>Delete Worker</b> button-um und.<br/>" \
         "2. <b>AdminCitizensPage.jsx:</b> Pauranmaarude (Citizens) mathram page. Avarude total submitted reports, approved reports, EcoReward points, active vouchers count kaanikkunnu. Ithilum Admin-u Approve and Delete options und."
    story.append(make_qa_box(q8, a8, tag="FILES: AdminWorkersPage.jsx & AdminCitizensPage.jsx", tag_color=C_AMBER))
    story.append(Spacer(1, 8))

    # 9. CitizenReportGarbage.jsx & WorkerRoutePage.jsx
    q9 = "Garbage reporting form-il camera-yum map-um, pinne worker-inte mobile route-um enganeya operate aavunnath?"
    a9 = "• <b>CitizenReportGarbage.jsx:</b> Direct phone camera capture (<code>capture='user'</code>) support cheyyunnu. HTML5 Geolocation API vazhi user click cheythaal mathram GPS location edukkum. Leaflet interactive map-il red pin drag cheytho tap cheytho road coordinates select cheyyaam. Anti-duplicate submission locks ullathukondu multiple taps duplicate create cheyyilla.<br/>" \
         "• <b>WorkerRoutePage.jsx:</b> Sanitation truck driver-u vendi touch-friendly aayi optimize cheytha mobile page. Annathe sequential stops (Stop #1, Stop #2) kaanikkum. Waste photo thumbnail, severity badge (Red/Amber), directions kaanikkum. Driver waste load cheythu kazhinjal single-tap <b>'Mark Collected'</b> adikkumbo status instant aayi complete aavum."
    story.append(make_qa_box(q9, a9, tag="FILES: CitizenReportGarbage.jsx & WorkerRoutePage.jsx", tag_color=C_SECONDARY))
    story.append(Spacer(1, 8))

    # 10. ProfileModal.jsx
    q10 = "Profile management enganeya? All users-num profile edit cheyyaan pattumo?"
    a10 = "Sir, Admin, Worker, Citizen - 3 perkkum dashboard-inte top-right avatar click cheythaal <b>ProfileModal.jsx</b> open aavum:<br/>" \
          "• <b>View Profile:</b> Photo, name, email, phone, age, gender, address, role, worker aanel Driving License details kaanikkum.<br/>" \
          "• <b>Edit Profile:</b> Details update cheyyaam, camera vazhi new profile photo capture cheythu save cheyyaam.<br/>" \
          "• Save aayal frontend header-il avatar image instant aayi sync aavum."
    story.append(make_qa_box(q10, a10, tag="FILE: frontend/src/components/ProfileModal.jsx", tag_color=C_PRIMARY))
    story.append(Spacer(1, 10))

    # =========================================================================
    # PART 3: TOP 5 TRICKY VIVA QUESTIONS & CRISP ANSWERS
    # =========================================================================
    story.append(Paragraph("PART 3: TOP 5 TRICKY INTERVIEW QUESTIONS & CRISP ANSWERS", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_PRIMARY, spaceBefore=1, spaceAfter=8))

    tricky_qa = [
        ("Database-il passwords plain text aano save aavunnath?",
         "Alla Sir. Django-ude default <b>PBKDF2 with SHA-256</b> cryptographic hashing algorithm use cheythaanu password store cheyyunnath. Database compromise aayaalum plain password aarkkum decrypt cheyyaan pattilla."),
        ("Why React + Django instead of MERN stack (Node + Express + Mongo)?",
         "Sir, waste management system-il spatial GIS coordinates, mathematical TSP optimization algorithms, and Computer Vision processing und. Python has superior AI & scientific computing libraries (NumPy, Pillow, Math), and Django provides enterprise ORM, role security, and relational ACID compliance compared to NoSQL MongoDB."),
        ("Single superuser admin enganeya enforce cheythittullath? Can anyone register as admin?",
         "Sir, backend registration endpoint-il <code>role='admin'</code> request vannal athu reject cheyyunnu. Public registration citizen and worker-u mathramaayi restrict cheythittund. Only database seed script or Django <code>createsuperuser</code> CLI vazhi mathrame single admin create aavu."),
        ("Why did you build a responsive web app instead of a native Android/iOS mobile application?",
         "Building a unified responsive web app ensures that citizens, sanitation drivers, and municipal officers can access the platform instantly from any smartphone browser without app store installations or device OS compatibility issues. It uses Progressive Web App (PWA) standards with 44x44px touch targets."),
        ("How does the EcoRewards gamification prevent fraudulent reward point farming?",
         "Citizens-u report submit cheytha udane points kittilla. Report status <code>'pending'</code> aayirikkum. Municipal administration review cheythu <code>'approved'</code> aakkumbo mathrame +20 EcoPoints account-il credit aavu. Furthermore, GPS coordinates and duplicate submission locks prevent spamming.")
    ]

    for q, a in tricky_qa:
        story.append(make_qa_box(q, a, tag="VIVA / INTERVIEW ESSENTIAL", tag_color=C_DARK))
        story.append(Spacer(1, 6))

    # Build PDF with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully created: {filename}")

if __name__ == "__main__":
    out_dir = r"C:\Users\LOQ\.gemini\antigravity\scratch\smart_waste_system"
    out_pdf = os.path.join(out_dir, "CleanCity_Code_Explanation_and_Interview_Guide.pdf")
    create_interview_pdf(out_pdf)
