import os
from PIL import Image, ImageDraw, ImageFont
import pymupdf

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "synthetic_packages"))


def create_pdf(file_path: str, title: str, sections: list):
    """Generate a clean, structured claims PDF document."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    doc = pymupdf.open()
    page = doc.new_page(width=612, height=792)  # Standard Letter size

    # Header Banner
    page.draw_rect(pymupdf.Rect(36, 36, 576, 75), color=(0.1, 0.2, 0.4), fill=(0.93, 0.95, 0.98), width=1)
    page.insert_text(pymupdf.Point(48, 62), title, fontsize=16, fontname="helv", color=(0.1, 0.2, 0.5))

    y = 95
    for heading, lines in sections:
        if y > 720:
            page = doc.new_page(width=612, height=792)
            y = 50

        # Section header
        page.draw_line(pymupdf.Point(36, y), pymupdf.Point(576, y), color=(0.7, 0.75, 0.8), width=0.5)
        y += 14
        page.insert_text(pymupdf.Point(36, y), heading.upper(), fontsize=11, fontname="helv", color=(0.15, 0.25, 0.45))
        y += 16

        # Content lines
        for line in lines:
            if y > 730:
                page = doc.new_page(width=612, height=792)
                y = 50
            page.insert_text(pymupdf.Point(46, y), line, fontsize=9.5, fontname="helv", color=(0.15, 0.15, 0.15))
            y += 14
        y += 10

    # Footer
    page.insert_text(
        pymupdf.Point(36, 770),
        "ClaimScope Synthetic Incident Data — Generated for Evaluation & Verification",
        fontsize=8,
        color=(0.5, 0.5, 0.5),
    )

    doc.save(file_path)
    doc.close()
    print(f"Created PDF: {file_path}")


def create_damage_photo(
    file_path: str,
    view_title: str,
    damage_text: str,
    severity: str,
    color_scheme: str = "silver",
):
    """Generate a synthetic accident damage photo with realistic visual regions and markings."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    width, height = 800, 600
    img = Image.new("RGB", (width, height), color=(235, 238, 242))
    draw = ImageDraw.Draw(img)

    # Asphalt background
    draw.rectangle([0, 420, width, height], fill=(60, 64, 70))
    # Road markings
    draw.line([50, 520, 200, 520], fill=(230, 200, 40), width=6)
    draw.line([300, 520, 450, 520], fill=(230, 200, 40), width=6)
    draw.line([550, 520, 700, 520], fill=(230, 200, 40), width=6)

    # Vehicle body silhouette
    body_color = (180, 185, 192) if color_scheme == "silver" else (40, 50, 70)
    draw.polygon([(120, 420), (160, 220), (320, 160), (560, 160), (700, 240), (720, 420)], fill=body_color, outline=(20, 25, 30))

    # Wheels
    draw.ellipse([200, 360, 310, 470], fill=(25, 25, 25), outline=(150, 150, 150), width=4)
    draw.ellipse([540, 360, 650, 470], fill=(25, 25, 25), outline=(150, 150, 150), width=4)

    # Windows
    draw.polygon([(200, 220), (320, 175), (440, 175), (440, 220)], fill=(120, 160, 190), outline=(30, 30, 30))
    draw.polygon([(455, 220), (455, 175), (550, 175), (660, 240), (580, 240)], fill=(120, 160, 190), outline=(30, 30, 30))

    # Damage representation
    if severity == "minor":
        # Surface scratches
        draw.line([640, 300, 690, 315], fill=(240, 240, 240), width=3)
        draw.line([645, 310, 700, 325], fill=(240, 240, 240), width=2)
        draw.arc([630, 290, 710, 340], start=30, end=150, fill=(220, 50, 50), width=3)
    elif severity == "moderate":
        # Dented panel and broken lens
        draw.polygon([(620, 260), (690, 280), (670, 360), (600, 330)], fill=(120, 125, 130), outline=(220, 40, 40), width=3)
        draw.line([630, 270, 680, 340], fill=(20, 20, 20), width=4)
        draw.ellipse([670, 260, 710, 290], fill=(200, 80, 80), outline=(255, 255, 255), width=2)
    elif severity == "severe":
        # Crushed front / quarter panel and deployed airbags
        draw.polygon([(600, 220), (740, 320), (680, 420), (560, 380)], fill=(70, 70, 70), outline=(255, 30, 30), width=5)
        for offset in range(0, 80, 15):
            draw.line([600 + offset, 240, 650 + offset, 380], fill=(30, 30, 30), width=4)
        # Airbag deployment circle in cabin
        draw.ellipse([340, 200, 410, 270], fill=(245, 245, 245), outline=(180, 180, 180), width=3)
        # Fluid pool on road
        draw.ellipse([580, 430, 720, 470], fill=(20, 20, 25))

    # Information Overlay Card
    draw.rectangle([20, 20, 380, 130], fill=(255, 255, 255), outline=(180, 190, 205), width=2)
    draw.text((32, 28), f"CLAIM EVIDENCE PHOTO: {view_title.upper()}", fill=(15, 25, 55))
    draw.text((32, 50), f"Visible Impact: {damage_text}", fill=(60, 70, 85))
    draw.text((32, 70), f"Apparent Severity Level: {severity.upper()}", fill=(180, 30, 30) if severity == "severe" else (30, 120, 60))
    draw.text((32, 92), "Forensic Metadata: ISO 200 | Shutter 1/250 | No Flash", fill=(110, 120, 135))
    draw.text((32, 110), "Grounded Vision Evaluation Target", fill=(120, 130, 140))

    img.save(file_path)
    print(f"Created Photo: {file_path}")


def generate_all_cases():
    print(f"Generating synthetic cases at {BASE_DIR}...")

    # =========================================================================
    # CASE A: FNOL ONLY (Routine single-vehicle scrape)
    # =========================================================================
    case_a_dir = os.path.join(BASE_DIR, "case_a_fnol_only")
    create_pdf(
        os.path.join(case_a_dir, "incident_form.pdf"),
        "AUTOMOBILE LOSS NOTICE (ACORD 1)",
        [
            ("Policy & Insured Information", [
                "Policy Number: POL-2026-88419",
                "Policy Term: 01/01/2026 to 01/01/2027",
                "Insured Name: David K. Miller",
                "Phone: (217) 555-0142",
                "Address: 742 Evergreen Terrace, Springfield, IL 62704",
            ]),
            ("Vehicle Details", [
                "Vehicle: 2022 Honda Accord Sedan (Silver)",
                "VIN: 1HGCV1F39NA042189",
                "License Plate: IL-882-XYZ",
                "Odometer: 24,180 miles",
                "Driveable: Yes",
            ]),
            ("Incident Time & Location", [
                "Date of Incident: September 14, 2026",
                "Time of Incident: 02:30 PM (14:30)",
                "Location: 450 North Elm Street, Springfield, IL",
                "Weather Conditions: Clear and dry",
                "Road Conditions: Dry asphalt",
            ]),
            ("Description of Accident", [
                "Insured vehicle was lawfully stopped in the northbound lane waiting to turn right.",
                "Another vehicle backed out of a residential driveway at low speed and made minor contact with insured rear bumper.",
                "Driver exchanged insurance information peacefully with neighbor.",
            ]),
            ("Reported Physical Damage", [
                "Damage Area: Rear bumper cover",
                "Damage Description: Cosmetic scuffs and light horizontal scratch across center fascia. Minor crack on right reflector.",
                "Estimated Repair Cost: $650.00",
            ]),
            ("Authorities & Witnesses", [
                "Police Contacted: No (no injuries and minor property damage under state reporting threshold)",
                "Police Report Number: None",
                "Injuries Reported: None",
            ]),
        ],
    )

    # =========================================================================
    # CASE B: FNOL + PHOTOGRAPHS (Consistent Minor/Moderate)
    # =========================================================================
    case_b_dir = os.path.join(BASE_DIR, "case_b_fnol_photos")
    create_pdf(
        os.path.join(case_b_dir, "incident_form.pdf"),
        "FIRST NOTICE OF LOSS — POLICYHOLDER REPORT",
        [
            ("Policy Details", [
                "Policy Number: POL-2026-44211",
                "Insured Name: Sarah Jenkins",
                "Contact: (614) 555-0188",
                "Claim Number: CLM-2026-00441",
            ]),
            ("Vehicle Identification", [
                "Vehicle: 2023 Toyota RAV4 XLE (Magnetic Gray)",
                "VIN: 2T3C1RFV5PC198273",
                "Plate: OH-ABC-492",
            ]),
            ("Incident Details", [
                "Date: October 03, 2026 at 09:15 AM",
                "Location: S High St & Columbus St, Columbus, OH",
                "Narrative: Policyholder slid on wet autumn leaves while turning right into parking lot, contacting concrete curb and low barrier.",
                "Reported Damage: Front passenger bumper scuffed and lower grille cracked.",
            ]),
        ],
    )
    create_damage_photo(
        os.path.join(case_b_dir, "damage_photo_front.png"),
        "Front Passenger Fascia",
        "Scuffed bumper cover, cracked lower grille bar",
        "moderate",
        color_scheme="dark",
    )
    create_damage_photo(
        os.path.join(case_b_dir, "damage_photo_wheel.png"),
        "Right Front Wheel & Fender",
        "Light rim scuff against curb, cosmetic fender lip scrape",
        "minor",
        color_scheme="dark",
    )

    # =========================================================================
    # CASE C: COMPLETE PACKAGE (FNOL + Police + Estimate + Photos — Consistent)
    # =========================================================================
    case_c_dir = os.path.join(BASE_DIR, "case_c_complete_consistent")
    create_pdf(
        os.path.join(case_c_dir, "incident_form.pdf"),
        "FIRST NOTICE OF LOSS — AUTOMOBILE CLAIM",
        [
            ("Insured & Policy", [
                "Policy Number: POL-2026-10923",
                "Insured: Robert Martinez",
                "Phone: (303) 555-0177",
            ]),
            ("Vehicle", [
                "Vehicle: 2021 Ford F-150 XLT (Silver)",
                "VIN: 1FTFW1E84MFA77192",
                "Plate: CO-784-WXZ",
            ]),
            ("Incident Facts", [
                "Date: August 22, 2026 at 08:15 AM",
                "Location: 8th Avenue and Pine Street, Denver, CO",
                "Description: Stopped at red light facing east on 8th Ave. Struck directly from behind by Chevrolet Malibu traveling approximately 20 mph.",
                "Reported Damage: Rear bumper pushed forward into tailgate. Hitch assembly bent downward.",
                "Police Notified: Yes, Denver Police Department arrived on scene.",
            ]),
        ],
    )
    create_pdf(
        os.path.join(case_c_dir, "police_report.pdf"),
        "STATE OF COLORADO TRAFFIC CRASH REPORT",
        [
            ("Official Incident Header", [
                "Reporting Agency: Denver Police Department",
                "Report Number: DPD-2026-09412",
                "Date of Crash: August 22, 2026 at 08:15 AM",
                "Location: Intersection of 8th Ave & Pine St, Denver, CO",
                "Investigating Officer: Sgt. Thomas Vance, Badge #4190",
            ]),
            ("Unit 1 (Lead Vehicle)", [
                "Driver: Robert Martinez",
                "Vehicle: 2021 Ford F-150 (Silver), VIN: 1FTFW1E84MFA77192, Plate: CO-784-WXZ",
                "Action: Stopped in traffic for red signal",
                "Damage: Severe rear bumper deformation, tailgate buckle",
            ]),
            ("Unit 2 (Striking Vehicle)", [
                "Driver: Emily Taylor",
                "Vehicle: 2019 Chevrolet Malibu (Blue), Plate: CO-331-QRT",
                "Action: Inattentive, failed to stop in assured clear distance",
                "Citation Issued: CRS 42-4-1008 (Following Too Closely) to Driver 2",
            ]),
            ("Officer Collision Narrative", [
                "Unit 1 was fully stationary at red signal at 8th and Pine.",
                "Unit 2 driver stated she was adjusting vehicle radio controls and failed to notice traffic stopped ahead.",
                "Unit 2 struck Unit 1 rear bumper squarely. Skid marks from Unit 2 measured 12 feet.",
                "No alcohol or drug impairment detected.",
            ]),
        ],
    )
    create_pdf(
        os.path.join(case_c_dir, "repair_estimate.pdf"),
        "COLLISION ESTIMATE OF RECORD — MILE HIGH COLLISION",
        [
            ("Estimate Metadata", [
                "Estimate Number: EST-77402",
                "Facility: Mile High Collision Center, Denver CO",
                "Estimator: Marcus Brody (Lic #AP-8819)",
                "Date: August 25, 2026",
            ]),
            ("Vehicle Identification", [
                "Vehicle: 2021 Ford F-150 XLT 4WD (Silver)",
                "VIN: 1FTFW1E84MFA77192",
                "Odometer: 38,420 miles",
            ]),
            ("Itemized Operations & Parts", [
                "1. Replace Rear Bumper Face Bar (OEM #ML3Z-17906-CAPTM): $685.00, Labor: 2.2 hrs",
                "2. Replace Rear Bumper Brackets L/R: $184.00, Labor: 1.0 hrs",
                "3. Replace Tailgate Shell Assembly: $1,150.00, Labor: 3.5 hrs",
                "4. Repair & Align Trailer Hitch Crossmember: Labor: 2.5 hrs ($212.50)",
                "5. Refinish & Clearcoat Tailgate & Bumper: Paint Supplies: $420.00, Paint Labor: 5.0 hrs",
            ]),
            ("Estimate Summary Totals", [
                "Parts Total: $2,019.00",
                "Body Labor (9.2 hrs @ $85/hr): $782.00",
                "Paint Labor (5.0 hrs @ $85/hr): $425.00",
                "Paint Supplies: $420.00",
                "Sales Tax (8.81%): $328.50",
                "GROSS REPAIR TOTAL: $3,974.50",
            ]),
        ],
    )
    create_damage_photo(
        os.path.join(case_c_dir, "rear_damage_photo.png"),
        "Rear Bumper and Tailgate",
        "Crumpled chrome bumper pushed into tailgate lip",
        "moderate",
        color_scheme="silver",
    )

    # =========================================================================
    # CASE D: CONTRADICTORY (FNOL vs Police Report vs Photos — Major Inconsistencies)
    # =========================================================================
    case_d_dir = os.path.join(BASE_DIR, "case_d_contradictory")
    create_pdf(
        os.path.join(case_d_dir, "incident_form.pdf"),
        "FIRST NOTICE OF LOSS — AUTOMOBILE CLAIM",
        [
            ("Policyholder Information", [
                "Policy Number: POL-2026-99301",
                "Claimant: Mark Henderson",
                "Phone: (408) 555-0199",
            ]),
            ("Vehicle Description", [
                "Vehicle: 2020 BMW 330i (Black)",
                "VIN: WBA5R1C58LAH88123",
                "License Plate: CA-7XYZ89",
            ]),
            ("Date, Time, & Location", [
                "Incident Date: October 05, 2026",
                "Incident Time: 09:00 PM (21:00)",
                "Location: Highway 101 Northbound at Mile Marker 14, San Jose, CA",
            ]),
            ("Driver Narrative", [
                "Policyholder claims: 'I was driving home on the highway when a deer ran across the lanes. "
                "I swerved onto the right shoulder to avoid the animal and scraped the right bumper against a wooden milepost. "
                "Single vehicle accident. No other cars involved or contacted. Drove home safely.'",
            ]),
            ("Claimed Damage", [
                "Damage Description: Minor scuff on front right bumper plastic only.",
                "Estimated Cost: $500.00",
                "Police Involved: No, not called.",
            ]),
        ],
    )
    create_pdf(
        os.path.join(case_d_dir, "police_report.pdf"),
        "CALIFORNIA HIGHWAY PATROL — COLLISION INVESTIGATION REPORT",
        [
            ("Official Header", [
                "Jurisdiction: California Highway Patrol (San Jose Area)",
                "Report Number: CHP-2026-55418",
                "Crash Date: October 06, 2026 at 02:30 AM",
                "Crash Location: Intersection of 1st Street & Santa Clara Avenue, Downtown San Jose, CA",
                "Reporting Officer: Officer D. Alvarez, Badge #18442",
            ]),
            ("Involved Parties & Vehicles", [
                "Party 1 (At-Fault): Mark Henderson, DOB: 04/12/1994",
                "Vehicle 1: 2020 BMW 330i (Black), VIN: WBA5R1C58LAH99999, Plate: CA-7XYZ89",
                "Party 2: Carlos Ortiz (Honda Civic)",
            ]),
            ("Officer Collision Narrative & Findings", [
                "OFFICER NARRATIVE: At approximately 02:35 hours, officers responded to a major two-vehicle broadside collision.",
                "Multiple witnesses stated Party 1 (BMW) was traveling northbound on 1st St at an estimated speed exceeding 55 mph in a 25 mph zone.",
                "Party 1 failed to stop for a solid red signal and broadsided Party 2 in the intersection.",
                "Party 1 attempted to reverse and leave the scene on foot but was detained by patrol officers.",
                "CITATIONS: Party 1 cited for CVC 21453(a) (Red Light Violation), CVC 22350 (Unsafe Speed), and CVC 20002(a) (Hit and Run with Property Damage).",
            ]),
            ("Physical Evidence & Damage", [
                "Heavy front-end destruction to BMW. Steering wheel and curtain airbags fully deployed.",
                "Fluid spill across two lanes. Vehicle non-drivable, towed from scene by City Towing.",
                "Injuries: Party 2 transported to Valley Medical Center for neck and back contusions.",
            ]),
        ],
    )
    create_damage_photo(
        os.path.join(case_d_dir, "damage_photo_severe.png"),
        "Front End & Cabin Intrusion",
        "Severe crush to front radiator, hood folded, steering wheel airbag deployed",
        "severe",
        color_scheme="dark",
    )

    # =========================================================================
    # CASE E: INCOMPLETE / SCANNED / POOR QUALITY
    # =========================================================================
    case_e_dir = os.path.join(BASE_DIR, "case_e_incomplete")
    create_pdf(
        os.path.join(case_e_dir, "scanned_handwritten_note.pdf"),
        "HANDWRITTEN CLAIM NOTICE — SPARSE INTAKE",
        [
            ("Policyholder Statement", [
                "To claims dept:",
                "I had an accident on Tuesday afternoon.",
                "A car bumped me while I was parallel parking on Oak Street.",
                "My bumper is dented and the paint came off.",
                "Please call me back at 555-0192.",
                "- Thomas",
            ]),
            ("Missing Metadata Audit Notice", [
                "[Missing]: Policy Number not specified",
                "[Missing]: Vehicle Year / Make / Model / VIN not provided",
                "[Missing]: Full incident date and time omitted",
                "[Missing]: No damage photographs attached",
                "[Missing]: Other party contact omitted",
            ]),
        ],
    )

    print("All synthetic test cases generated successfully!")


if __name__ == "__main__":
    generate_all_cases()
