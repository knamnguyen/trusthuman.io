[*] change color of card currently being previewed
[*] scroll to card when highlighted selected in nav
[*] verify comment submitted function
[*] refactored prisma schema to multi file setup
[*] check urn(s) data collection while scraping posts
=> contained inside data-urn => just save this to postAlternateUrn (single item list)

[] tag post author
[] image adding to content
[] fix engage button in individual post page
[] convert engage button to generating same cards - maybe remove 1 variations by default just uses 3 variations (but then which variations do you save?)

[] needs organization switcher manually in sidebar chrome extension (get from clerk for single source of truth) => maybe no need

=> also your touch + editing means that saving cannot be instant
=> should have manual queue then? only save when submitting?
=> makes things faster

[] needs check in with Lam on webapp logic for getting user current linkedin account
[] webapp needs linkedin account switcher => does it or is org url enough

=> probably simplest solution is to implement global limit on list of 25 members

[] test and check target list 25 pp limit
[] upload to s3 from url on server reusable utility
[] set up save to db flow and update status flow
[] set up queue/history view in sidebar

[] update and test import/export persona and target lists

generate comment success => save comment + post data
delete before submit
