$file = "c:\Users\shari\OneDrive\Desktop\BioPeptix\testimonials.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Testimonio 1
$content = $content -replace '(?s)(<!-- 1 -->.*?<div class="author-avatar">)MR(</div>.*?<div class="author-name">)Marcus R\.(</div>.*?<div class="author-title" data-i18n="t1_title">)Professional Athlete(</div>.*?<span class="product-used">)BPC-157 Ultra Pure(</span>)', '<!-- 1 -->$0'
# Approach: replace specific text strings directly

# Fix testimonial texts (static fallback text in HTML)
$content = $content -replace '"BPC-157 changed my recovery game completely\. Knee injury that had been bothering me for months improved in just 3 weeks\. The quality is absolutely unmatched\."', '"Tirzepatide has been a game-changer for my weight management journey. I lost 12 kg in 3 months. The product arrived discreetly, was easy to reconstitute, and the results have been absolutely life-changing."'

$content = $content -replace 'MR</div>.*?Marcus R\.', 'FC</div>
          <div>
            <div class="author-name">Felipe C.'

$content = $content -replace '<div class="author-title" data-i18n="t1_title">Professional Athlete</div>', '<div class="author-title" data-i18n="t1_title">Fitness Coach</div>'

$content = $content -replace '<span class="product-used">BPC-157 Ultra Pure</span>', '<span class="product-used">Tirzepatide 15mg</span>'

# Testimonial 2
$content = $content -replace '"Fast, discreet shipping and the product is exactly as described\. The Collagen Serum has noticeably improved my skin and joint flexibility after 6 weeks of use\."', '"I''ve been using Retatrutide for fat loss alongside training. The difference is remarkable — visceral fat reduction in 6 weeks. BioPeptix delivered fast, quality is top notch, and the packaging was completely discreet."'

$content = $content -replace 'SL</div>.*?Sofia L\.', 'AM</div>
          <div>
            <div class="author-name">Andrés M.'

$content = $content -replace '<div class="author-title" data-i18n="t2_title">Biohacker &amp; Performance Coach</div>', '<div class="author-title" data-i18n="t2_title">Competitive Bodybuilder</div>'

$content = $content -replace '<span class="product-used">Collagen Matrix Serum</span>', '<span class="product-used">Retatrutide 20mg</span>'

# Testimonial 3
$content = $content -replace '"Tried the Recovery Stack Pro before my competition — the results were incredible\. BioPeptix is now my go-to\. Trustworthy, transparent, and effective\."', '"BPC-157 is incredible for recovery. Had chronic knee inflammation for over a year — after 4 weeks of protocol, the improvement was dramatic. BioPeptix is now my only trusted source for peptides."'

$content = $content -replace 'James K\.', 'Juan K.'
$content = $content -replace '<div class="author-title" data-i18n="t3_title">Competitive Powerlifter</div>', '<div class="author-title" data-i18n="t3_title">Elite Crossfit Athlete</div>'
$content = $content -replace '<span class="product-used">Recovery Stack Pro</span>', '<span class="product-used">BPC-157 10mg</span>'

# Testimonial 4
$content = $content -replace '"I was skeptical at first, but the GHK-Cu results on my skin are remarkable\. Fine lines reduced significantly\. Will definitely reorder — and already recommended to my entire wellness group\."', '"TB-500 + BPC-157 stack helped me recover from a shoulder surgery in half the time my physio projected. The packaging was 100% discreet and arrived in perfect condition. Will order again without hesitation."'

$content = $content -replace 'DM</div>.*?Diana M\.', 'LR</div>
          <div>
            <div class="author-name">Laura R.'

$content = $content -replace '<div class="author-title" data-i18n="t4_title">Aesthetics &amp; Wellness Specialist</div>', '<div class="author-title" data-i18n="t4_title">Marathon Runner</div>'
$content = $content -replace '<span class="product-used">GHK-Cu Copper Peptide</span>', '<span class="product-used">BPC157 10mg + TB500 10mg</span>'

# Testimonial 5
$content = $content -replace '"TB-500 helped me recover from a shoulder injury in half the time my doctor projected\. The packaging was completely discreet and arrived in perfect condition\."', '"GHK-Cu has done wonders for my skin elasticity and joint health. After 8 weeks, fine lines visibly reduced and my knees feel 10 years younger. BioPeptix quality is exactly as advertised — ≥99% purity."'

$content = $content -replace 'AT</div>.*?Alex T\.', 'DM</div>
          <div>
            <div class="author-name">Diana M.'

$content = $content -replace '<div class="author-title" data-i18n="t5_title">CrossFit Athlete</div>', '<div class="author-title" data-i18n="t5_title">Anti-Aging Specialist</div>'
$content = $content -replace '<span class="product-used">TB-500 Thymosin Beta</span>', '<span class="product-used">GHK-CU 100mg</span>'

# Testimonial 6
$content = $content -replace '"Best customer service in this space\. Had a question about dosing and got a detailed, knowledgeable response within hours\. The Hyaluronic Acid Pro is also exceptional\."', '"NAD+ protocol has transformed my energy levels and mental clarity. I''m 52 years old and feel like I''m 35. Shipping was fast, packaging discreet, and the customer support answered all my dosing questions within hours."'

$content = $content -replace 'Rachel B\.', 'Roberto B.'
$content = $content -replace '<div class="author-title" data-i18n="t6_title">Sports Nutritionist</div>', '<div class="author-title" data-i18n="t6_title">Executive &amp; Biohacker</div>'
$content = $content -replace '<span class="product-used">Hyaluronic Acid Pro</span>', '<span class="product-used">NAD+ 500mg</span>'

# Testimonial 7
$content = $content -replace '"Third order and still consistently impressed\. The lab reports they provide give me confidence in the purity claims\. I''ve tried competitors — BioPeptix is in a different league\."', '"Ipamoreline + CJC-1295 stack gave me the best sleep of my life within the first week. Recovery improved dramatically, body composition shifted noticeably. Third order from BioPeptix — consistent quality every time."'

$content = $content -replace 'Carlos P\.', 'Carlos P.'
$content = $content -replace '<div class="author-title" data-i18n="t7_title">Longevity Researcher</div>', '<div class="author-title" data-i18n="t7_title">Strength &amp; Conditioning Coach</div>'
$content = $content -replace '<span class="product-used">BPC-157 Ultra Pure</span>', '<span class="product-used">CJC-1295 without DAC 5mg + Ipamorelin 5mg</span>'

# Testimonial 8
$content = $content -replace '"Great products and super fast shipping\. I ordered on Tuesday and had my package by Thursday\. The plain packaging is exactly what I needed\. Highly recommend to anyone serious about optimization\."', '"Epithalon has been part of my longevity stack for 6 months. My lab markers have improved across the board. I appreciate that BioPeptix provides lab test reports — purity is everything with peptides."'

$content = $content -replace '<div class="author-title" data-i18n="t8_title">Functional Medicine Practitioner</div>', '<div class="author-title" data-i18n="t8_title">Longevity Researcher</div>'
$content = $content -replace '<span class="product-used">Recovery Stack Pro</span>', '<span class="product-used">Epithalon 10mg</span>'

# Testimonial 9
$content = $content -replace '"The quality difference is noticeable immediately\. I''ve been using peptides for 2 years from various sources, and BioPeptix stands out for consistency, purity, and customer care\."', '"PT-141 works exactly as described. Discreet packaging, fast 24-hour delivery, and the product quality is unmatched. BioPeptix stands out for transparency and consistency. I''ve tried other sources — there''s no comparison."'

$content = $content -replace 'NF</div>.*?Nicolás F\.', 'MH</div>
          <div>
            <div class="author-name">Miguel H.'

$content = $content -replace '<div class="author-title" data-i18n="t9_title">Biohacker &amp; Entrepreneur</div>', '<div class="author-title" data-i18n="t9_title">Men''s Health Advocate</div>'
$content = $content -replace '<span class="product-used">GHK-Cu Copper Peptide</span>', '<span class="product-used">PT141 10mg</span>'

Set-Content $file $content -Encoding UTF8 -NoNewline
Write-Host "Done"
