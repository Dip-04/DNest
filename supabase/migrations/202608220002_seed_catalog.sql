insert into public.daily_questions(question,category) values
('What is one small thing your partner did recently that made you smile?','everyday life'),
('Which ordinary day together would you happily relive?','memories'),
('Where would you take us tomorrow if distance and money disappeared?','travel'),
('What is something about our future you quietly look forward to?','future'),
('What was your first impression of me?','relationship'),
('What is one new tradition you would love for us to start?','dreams'),
('What tiny detail about me do you think others miss?','emotional'),
('Which of our inside jokes still makes you laugh?','funny') on conflict(question) do nothing;

insert into public.date_ideas(title,description,duration_minutes,category,instructions) values
('The same-window sunset','Call while you each watch the sky change and trade one photo afterward.',15,'15-minute',array['Pick a time','Step outside or find a window','Share one detail you noticed']),
('Three-song story','Choose three songs that tell a tiny story about your week, then listen together.',30,'30-minute',array['Pick three songs each','Take turns explaining one choice','Save a shared favorite']),
('Cook one comfort meal','Choose one simple recipe, shop separately, and make it side by side on video.',75,'1-hour',array['Choose a recipe','Set up your call','Plate and eat together']),
('Our impossible itinerary','Plan a dream day anywhere in the world with no budget or travel limits.',45,'30-minute',array['Pick a city at random','Each choose one stop','Name the moment you would photograph']),
('Memory sketch','Each draw the same shared memory from memory, then reveal the drawings.',20,'15-minute',array['Choose a moment','Draw without showing','Reveal together']) on conflict do nothing;

insert into public.challenges(title,description,duration_days,prompts) values
('7 Days of Appreciation','One gentle observation of something you appreciate each day.',7,array['A quality you admire','A recent kindness','Something they make easier','A detail you love','A way they help you grow','A memory you treasure','What you choose again']),
('Photo Week','One honest photo from your day—beautiful, ordinary, or both.',7,array['Your view','Something that made you pause','A color from today','Your comfort','A small joy','Where you wish they were','The week in one frame']),
('Future Dreams','Spend five days imagining possibilities without turning them into pressure.',5,array['A place','A tradition','An ordinary morning','Something to learn','One shared hope']) on conflict(title) do nothing;
