CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  role text,
  institution text,
  country text,
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_read_approved_reviews" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "anyone_can_submit_review" ON public.reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');

INSERT INTO public.reviews (name, role, institution, country, rating, content, status) VALUES
('Ayesha Siddiqui', 'Biology Teacher', 'Beaconhouse School System', 'Pakistan', 5, 'Pehle ek monthly test banane mein poora din lagta tha. NSAGPT se chapter upload karti hoon aur 2 minute mein MCQs, short aur long questions ready ho jate hain. Urdu papers bhi bilkul saaf print hote hain.', 'approved'),
('Muhammad Bilal Khan', 'Head of Mathematics', 'Punjab Group of Colleges, Lahore', 'Pakistan', 5, 'The numericals solver is the real winner for us. Step-by-step working with correct units means I can share solutions with students the same day. Paper builder ka layout board pattern se bohat milta hai.', 'approved'),
('Sarah Whitfield', 'Science Coordinator', 'Oakridge Academy, Manchester', 'United Kingdom', 5, 'We trialled three question generators this term and NSAGPT was the only one that produced exam-standard long questions from our own scheme of work rather than generic textbook content.', 'approved'),
('Fatima Noor', 'Principal', 'Al-Noor Academy, Karachi', 'Pakiston', 4, 'Staff ne bohat asaani se seekh liya. Notes generator se teachers apne handouts bana lete hain aur logo lagne ke baad papers school ki identity ke saath print hote hain.', 'approved'),
('Daniel Okafor', 'Physics Tutor', 'BrightPath Tutoring, Lagos', 'Nigeria', 5, 'I upload a scanned worksheet photo and it reads the questions accurately, then solves each one with the formula shown. Saves me about six hours of marking prep every week.', 'approved'),
('Hina Raza', 'Chemistry Teacher', 'Army Public School, Rawalpindi', 'Pakistan', 5, 'Question bank aur history per-user save hoti hai, is liye purane papers dobara use kar leti hoon. Mixed selection mein khud MCQ 10, short 5, long 2 set karna bohat useful feature hai.', 'approved'),
('Rebecca Alvarez', 'Curriculum Lead', 'Riverside Charter School, Texas', 'United States', 4, 'Preview before download is exactly what other tools miss. I can fix wording, adjust marks and print a clean PDF without touching a word processor.', 'approved');

UPDATE public.reviews SET country = 'Pakistan' WHERE country = 'Pakiston';