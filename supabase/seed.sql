-- Seed reference/lookup data. Idempotent (safe to re-run on `supabase db reset`).

-- Fixed ids so roles are identical across every reset and environment —
-- makes debugging/joins predictable and rules out "id changed under me"
-- confusion when comparing rows across a `db reset`.
insert into public.roles (id, name) values
  ('00000000-0000-4000-8000-000000000001', 'super_admin'),
  ('00000000-0000-4000-8000-000000000002', 'admin'),
  ('00000000-0000-4000-8000-000000000003', 'counselor'),
  ('00000000-0000-4000-8000-000000000004', 'student'),
  ('00000000-0000-4000-8000-000000000005', 'university'),
  ('00000000-0000-4000-8000-000000000006', 'high_school')
on conflict (name) do nothing;

insert into public.currencies (name, code, symbol) values
  ('Mexican Peso', 'MXN', '$'),
  ('US Dollar', 'USD', '$'),
  ('Canadian Dollar', 'CAD', '$'),
  ('Euro', 'EUR', '€'),
  ('British Pound', 'GBP', '£')
on conflict (code) do nothing;

-- Full standard country/territory catalog (entries with an E.164 calling code).
insert into public.countries (name, name_es, iso_code, calling_code) values
  ('Afghanistan','Afganistán','AF','+93'),
  ('Albania','Albania','AL','+355'),
  ('Algeria','Argelia','DZ','+213'),
  ('American Samoa','Samoa Americana','AS','+1684'),
  ('Andorra','Andorra','AD','+376'),
  ('Angola','Angola','AO','+244'),
  ('Anguilla','Anguila','AI','+1264'),
  ('Antigua and Barbuda','Antigua y Barbuda','AG','+1268'),
  ('Argentina','Argentina','AR','+54'),
  ('Armenia','Armenia','AM','+374'),
  ('Aruba','Aruba','AW','+297'),
  ('Australia','Australia','AU','+61'),
  ('Austria','Austria','AT','+43'),
  ('Azerbaijan','Azerbaiyán','AZ','+994'),
  ('Bahamas','Bahamas','BS','+1242'),
  ('Bahrain','Baréin','BH','+973'),
  ('Bangladesh','Bangladés','BD','+880'),
  ('Barbados','Barbados','BB','+1246'),
  ('Belarus','Bielorrusia','BY','+375'),
  ('Belgium','Bélgica','BE','+32'),
  ('Belize','Belice','BZ','+501'),
  ('Benin','Benín','BJ','+229'),
  ('Bermuda','Bermudas','BM','+1441'),
  ('Bhutan','Bután','BT','+975'),
  ('Bolivia','Bolivia','BO','+591'),
  ('Bosnia and Herzegovina','Bosnia y Herzegovina','BA','+387'),
  ('Botswana','Botsuana','BW','+267'),
  ('Brazil','Brasil','BR','+55'),
  ('British Virgin Islands','Islas Vírgenes Británicas','VG','+1284'),
  ('Brunei','Brunéi','BN','+673'),
  ('Bulgaria','Bulgaria','BG','+359'),
  ('Burkina Faso','Burkina Faso','BF','+226'),
  ('Burundi','Burundi','BI','+257'),
  ('Cambodia','Camboya','KH','+855'),
  ('Cameroon','Camerún','CM','+237'),
  ('Canada','Canadá','CA','+1'),
  ('Cape Verde','Cabo Verde','CV','+238'),
  ('Cayman Islands','Islas Caimán','KY','+1345'),
  ('Central African Republic','República Centroafricana','CF','+236'),
  ('Chad','Chad','TD','+235'),
  ('Chile','Chile','CL','+56'),
  ('China','China','CN','+86'),
  ('Colombia','Colombia','CO','+57'),
  ('Comoros','Comoras','KM','+269'),
  ('Congo','Congo','CG','+242'),
  ('Cook Islands','Islas Cook','CK','+682'),
  ('Costa Rica','Costa Rica','CR','+506'),
  ('Croatia','Croacia','HR','+385'),
  ('Cuba','Cuba','CU','+53'),
  ('Curaçao','Curazao','CW','+599'),
  ('Cyprus','Chipre','CY','+357'),
  ('Czechia','Chequia','CZ','+420'),
  ('Côte d''Ivoire','Costa de Marfil','CI','+225'),
  ('Democratic Republic of the Congo','República Democrática del Congo','CD','+243'),
  ('Denmark','Dinamarca','DK','+45'),
  ('Djibouti','Yibuti','DJ','+253'),
  ('Dominica','Dominica','DM','+1767'),
  ('Dominican Republic','República Dominicana','DO','+1809'),
  ('Ecuador','Ecuador','EC','+593'),
  ('Egypt','Egipto','EG','+20'),
  ('El Salvador','El Salvador','SV','+503'),
  ('Equatorial Guinea','Guinea Ecuatorial','GQ','+240'),
  ('Eritrea','Eritrea','ER','+291'),
  ('Estonia','Estonia','EE','+372'),
  ('Eswatini','Esuatini','SZ','+268'),
  ('Ethiopia','Etiopía','ET','+251'),
  ('Falkland Islands','Islas Malvinas','FK','+500'),
  ('Faroe Islands','Islas Feroe','FO','+298'),
  ('Fiji','Fiyi','FJ','+679'),
  ('Finland','Finlandia','FI','+358'),
  ('France','Francia','FR','+33'),
  ('French Guiana','Guayana Francesa','GF','+594'),
  ('French Polynesia','Polinesia Francesa','PF','+689'),
  ('Gabon','Gabón','GA','+241'),
  ('Gambia','Gambia','GM','+220'),
  ('Georgia','Georgia','GE','+995'),
  ('Germany','Alemania','DE','+49'),
  ('Ghana','Ghana','GH','+233'),
  ('Gibraltar','Gibraltar','GI','+350'),
  ('Greece','Grecia','GR','+30'),
  ('Greenland','Groenlandia','GL','+299'),
  ('Grenada','Granada','GD','+1473'),
  ('Guadeloupe','Guadalupe','GP','+590'),
  ('Guam','Guam','GU','+1671'),
  ('Guatemala','Guatemala','GT','+502'),
  ('Guernsey','Guernsey','GG','+44'),
  ('Guinea','Guinea','GN','+224'),
  ('Guinea-Bissau','Guinea-Bisáu','GW','+245'),
  ('Guyana','Guyana','GY','+592'),
  ('Haiti','Haití','HT','+509'),
  ('Honduras','Honduras','HN','+504'),
  ('Hong Kong','Hong Kong','HK','+852'),
  ('Hungary','Hungría','HU','+36'),
  ('Iceland','Islandia','IS','+354'),
  ('India','India','IN','+91'),
  ('Indonesia','Indonesia','ID','+62'),
  ('Iran','Irán','IR','+98'),
  ('Iraq','Irak','IQ','+964'),
  ('Ireland','Irlanda','IE','+353'),
  ('Isle of Man','Isla de Man','IM','+44'),
  ('Israel','Israel','IL','+972'),
  ('Italy','Italia','IT','+39'),
  ('Jamaica','Jamaica','JM','+1876'),
  ('Japan','Japón','JP','+81'),
  ('Jersey','Jersey','JE','+44'),
  ('Jordan','Jordania','JO','+962'),
  ('Kazakhstan','Kazajistán','KZ','+7'),
  ('Kenya','Kenia','KE','+254'),
  ('Kiribati','Kiribati','KI','+686'),
  ('Kosovo','Kosovo','XK','+383'),
  ('Kuwait','Kuwait','KW','+965'),
  ('Kyrgyzstan','Kirguistán','KG','+996'),
  ('Laos','Laos','LA','+856'),
  ('Latvia','Letonia','LV','+371'),
  ('Lebanon','Líbano','LB','+961'),
  ('Lesotho','Lesoto','LS','+266'),
  ('Liberia','Liberia','LR','+231'),
  ('Libya','Libia','LY','+218'),
  ('Liechtenstein','Liechtenstein','LI','+423'),
  ('Lithuania','Lituania','LT','+370'),
  ('Luxembourg','Luxemburgo','LU','+352'),
  ('Macao','Macao','MO','+853'),
  ('Madagascar','Madagascar','MG','+261'),
  ('Malawi','Malaui','MW','+265'),
  ('Malaysia','Malasia','MY','+60'),
  ('Maldives','Maldivas','MV','+960'),
  ('Mali','Malí','ML','+223'),
  ('Malta','Malta','MT','+356'),
  ('Marshall Islands','Islas Marshall','MH','+692'),
  ('Martinique','Martinica','MQ','+596'),
  ('Mauritania','Mauritania','MR','+222'),
  ('Mauritius','Mauricio','MU','+230'),
  ('Mayotte','Mayotte','YT','+262'),
  ('Mexico','México','MX','+52'),
  ('Micronesia','Micronesia','FM','+691'),
  ('Moldova','Moldavia','MD','+373'),
  ('Monaco','Mónaco','MC','+377'),
  ('Mongolia','Mongolia','MN','+976'),
  ('Montenegro','Montenegro','ME','+382'),
  ('Montserrat','Montserrat','MS','+1664'),
  ('Morocco','Marruecos','MA','+212'),
  ('Mozambique','Mozambique','MZ','+258'),
  ('Myanmar','Myanmar','MM','+95'),
  ('Namibia','Namibia','NA','+264'),
  ('Nauru','Nauru','NR','+674'),
  ('Nepal','Nepal','NP','+977'),
  ('Netherlands','Países Bajos','NL','+31'),
  ('New Caledonia','Nueva Caledonia','NC','+687'),
  ('New Zealand','Nueva Zelanda','NZ','+64'),
  ('Nicaragua','Nicaragua','NI','+505'),
  ('Niger','Níger','NE','+227'),
  ('Nigeria','Nigeria','NG','+234'),
  ('Niue','Niue','NU','+683'),
  ('North Korea','Corea del Norte','KP','+850'),
  ('North Macedonia','Macedonia del Norte','MK','+389'),
  ('Northern Mariana Islands','Islas Marianas del Norte','MP','+1670'),
  ('Norway','Noruega','NO','+47'),
  ('Oman','Omán','OM','+968'),
  ('Pakistan','Pakistán','PK','+92'),
  ('Palau','Palaos','PW','+680'),
  ('Palestine','Palestina','PS','+970'),
  ('Panama','Panamá','PA','+507'),
  ('Papua New Guinea','Papúa Nueva Guinea','PG','+675'),
  ('Paraguay','Paraguay','PY','+595'),
  ('Peru','Perú','PE','+51'),
  ('Philippines','Filipinas','PH','+63'),
  ('Poland','Polonia','PL','+48'),
  ('Portugal','Portugal','PT','+351'),
  ('Puerto Rico','Puerto Rico','PR','+1787'),
  ('Qatar','Catar','QA','+974'),
  ('Romania','Rumania','RO','+40'),
  ('Russia','Rusia','RU','+7'),
  ('Rwanda','Ruanda','RW','+250'),
  ('Réunion','Reunión','RE','+262'),
  ('Saint Barthélemy','San Bartolomé','BL','+590'),
  ('Saint Helena','Santa Elena','SH','+290'),
  ('Saint Kitts and Nevis','San Cristóbal y Nieves','KN','+1869'),
  ('Saint Lucia','Santa Lucía','LC','+1758'),
  ('Saint Martin','San Martín','MF','+590'),
  ('Saint Pierre and Miquelon','San Pedro y Miquelón','PM','+508'),
  ('Saint Vincent and the Grenadines','San Vicente y las Granadinas','VC','+1784'),
  ('Samoa','Samoa','WS','+685'),
  ('San Marino','San Marino','SM','+378'),
  ('Saudi Arabia','Arabia Saudita','SA','+966'),
  ('Senegal','Senegal','SN','+221'),
  ('Serbia','Serbia','RS','+381'),
  ('Seychelles','Seychelles','SC','+248'),
  ('Sierra Leone','Sierra Leona','SL','+232'),
  ('Singapore','Singapur','SG','+65'),
  ('Sint Maarten','Sint Maarten','SX','+1721'),
  ('Slovakia','Eslovaquia','SK','+421'),
  ('Slovenia','Eslovenia','SI','+386'),
  ('Solomon Islands','Islas Salomón','SB','+677'),
  ('Somalia','Somalia','SO','+252'),
  ('South Africa','Sudáfrica','ZA','+27'),
  ('South Korea','Corea del Sur','KR','+82'),
  ('South Sudan','Sudán del Sur','SS','+211'),
  ('Spain','España','ES','+34'),
  ('Sri Lanka','Sri Lanka','LK','+94'),
  ('Sudan','Sudán','SD','+249'),
  ('Suriname','Surinam','SR','+597'),
  ('Sweden','Suecia','SE','+46'),
  ('Switzerland','Suiza','CH','+41'),
  ('Syria','Siria','SY','+963'),
  ('São Tomé and Príncipe','Santo Tomé y Príncipe','ST','+239'),
  ('Taiwan','Taiwán','TW','+886'),
  ('Tajikistan','Tayikistán','TJ','+992'),
  ('Tanzania','Tanzania','TZ','+255'),
  ('Thailand','Tailandia','TH','+66'),
  ('Timor-Leste','Timor Oriental','TL','+670'),
  ('Togo','Togo','TG','+228'),
  ('Tokelau','Tokelau','TK','+690'),
  ('Tonga','Tonga','TO','+676'),
  ('Trinidad and Tobago','Trinidad y Tobago','TT','+1868'),
  ('Tunisia','Túnez','TN','+216'),
  ('Turkey','Turquía','TR','+90'),
  ('Turkmenistan','Turkmenistán','TM','+993'),
  ('Turks and Caicos Islands','Islas Turcas y Caicos','TC','+1649'),
  ('Tuvalu','Tuvalu','TV','+688'),
  ('U.S. Virgin Islands','Islas Vírgenes de EE. UU.','VI','+1340'),
  ('Uganda','Uganda','UG','+256'),
  ('Ukraine','Ucrania','UA','+380'),
  ('United Arab Emirates','Emiratos Árabes Unidos','AE','+971'),
  ('United Kingdom','Reino Unido','GB','+44'),
  ('United States','Estados Unidos','US','+1'),
  ('Uruguay','Uruguay','UY','+598'),
  ('Uzbekistan','Uzbekistán','UZ','+998'),
  ('Vanuatu','Vanuatu','VU','+678'),
  ('Vatican City','Ciudad del Vaticano','VA','+379'),
  ('Venezuela','Venezuela','VE','+58'),
  ('Vietnam','Vietnam','VN','+84'),
  ('Wallis and Futuna','Wallis y Futuna','WF','+681'),
  ('Western Sahara','Sahara Occidental','EH','+212'),
  ('Yemen','Yemen','YE','+967'),
  ('Zambia','Zambia','ZM','+260'),
  ('Zimbabwe','Zimbabue','ZW','+263')
on conflict (iso_code) do update set
  name = excluded.name,
  name_es = excluded.name_es,
  calling_code = excluded.calling_code;

insert into public.languages (name) values ('English'), ('Spanish')
on conflict (name) do nothing;

insert into public.language_exams (language_id, name)
select l.id, e.name
from public.languages l
join (values
  ('English', 'IELTS'), ('English', 'TOEFL'), ('English', 'PTE'), ('English', 'Cambridge'),
  ('Spanish', 'DELE')
) as e(lang, name) on e.lang = l.name
on conflict (language_id, name) do nothing;

insert into public.fields_of_study (name) values
  ('Business'), ('Engineering'), ('Computer Science'), ('Medicine'), ('Law'),
  ('Arts & Humanities'), ('Natural Sciences'), ('Social Sciences')
on conflict (name) do nothing;

insert into public.education_levels (name) values
  ('High School (Grade 12)'), ('Diploma / Certificate'), ('Bachelor''s Degree'),
  ('Master''s Degree'), ('Doctoral Degree (PhD)')
on conflict (name) do nothing;

insert into public.education_models (name) values
  ('Bilingual'), ('International Baccalaureate'), ('Technical'), ('General'), ('Montessori')
on conflict (name) do nothing;

insert into public.financial_plans (name) values
  ('Self-funded'), ('Scholarship'), ('Family Plan'), ('Loan')
on conflict (name) do nothing;

insert into public.industries (name) values
  ('Technology'), ('Education'), ('Finance'), ('Healthcare'), ('Manufacturing')
on conflict (name) do nothing;

insert into public.document_types (name, required) values
  ('Transcript', true), ('Passport', true), ('Recommendation Letter', false),
  ('Test Scores', false), ('Motivation Letter', false)
on conflict (name) do nothing;

-- Student lifecycle statuses.
insert into public.statuses (entity_type, name, color, sort_order, is_terminal) values
  ('student', 'Registered', '#94a3b8', 10, false),
  ('student', 'Onboarding', '#38bdf8', 20, false),
  ('student', 'Documentation Pending', '#f59e0b', 30, false),
  ('student', 'University Selection', '#a78bfa', 40, false),
  ('student', 'Application Submitted', '#6366f1', 50, false),
  ('student', 'Accepted', '#22c55e', 60, false),
  ('student', 'Enrolled', '#16a34a', 70, true)
on conflict (entity_type, name) do nothing;

-- Per-application statuses.
insert into public.statuses (entity_type, name, color, sort_order, is_terminal) values
  ('application', 'Draft', '#94a3b8', 10, false),
  ('application', 'Submitted', '#6366f1', 20, false),
  ('application', 'Under Review', '#f59e0b', 30, false),
  ('application', 'Accepted', '#22c55e', 40, true),
  ('application', 'Rejected', '#ef4444', 50, true),
  ('application', 'Enrolled', '#16a34a', 60, true)
on conflict (entity_type, name) do nothing;

-- High school partnership statuses.
insert into public.statuses (entity_type, name, color, sort_order, is_terminal) values
  ('high_school', 'Prospect', '#94a3b8', 10, false),
  ('high_school', 'Active', '#22c55e', 20, false),
  ('high_school', 'Inactive', '#ef4444', 30, true)
on conflict (entity_type, name) do nothing;
