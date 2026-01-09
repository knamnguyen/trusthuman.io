[*] change color of card currently being previewed
[*] scroll to card when highlighted selected in nav
[*] verify comment submitted function
[*] refactored prisma schema to multi file setup
[*] check urn(s) data collection while scraping posts
=> contained inside data-urn => just save this to postAlternateUrn (single item list)
[*] fix engage button in individual post page
[*] convert engage button to generating same cards - maybe remove 1 variations by default just uses 3 variations (but then which variations do you save?)
[*] fetch analytics data once every new linkedin page load visits (max once every hour limit) instead of manual refetch
[*] space engage kinda works but not too well (because of focus state - mouse needs to move in ) - maybe just remove this feat for now
[*] needs organization switcher manually in sidebar chrome extension (get from clerk for single source of truth) => maybe no need
[*] organization current id might not be able to deduce from clerk in the backend => check thi
[*] => match current account id

//requires for db

- target list can only have maximum 25 members - enforce default
  => when rendering target list for selection => remove "all" list from option since that is just default and users cannot change (even when user removes a profile from all lists that profile is still in the 'all list' => rename "history list")

=> registerByUrl => have not setup post scraping flow yet
=> also adding people to target list from comments

=> simpler: just disable manage target list add button for now for those added from comments
=> ignore profile scraping altogether for now for both registerByUrl and adding to targetlist

=> simple: ignore s3 bucket thing => just save direct data from linkedin feed including media urls to db

[] before running the load posts - check for current url (check whether running in targetlist mode or not)
=> if not correct url (feed or search page => needs to navigate there)

=> also your touch + editing means that saving cannot be instant
=> should have manual queue then? only save when submitting?

1. saving in extensions first - worry about saving for pre-generate comment webapp later
   => what about saving logic on webapp - pregenerate comments save where? or only generate comments on demand?

=> saving in extension - only when confirmed saving successful

=> makes things faster

hyperbrowser + webapp

- feed
- schedule commenting

each profile

- target list + manage
- manage flow of comment generation flow
- all settings
- organization manage flow

[] needs check in with Lam on webapp logic for getting user current linkedin account
[] webapp needs linkedin account switcher => does it or is org url enough

[] tag post author
[] image adding to content

=> probably simplest solution is to implement global limit on list of 25 members

[] test and check target list 25 pp limit
[] upload to s3 from url on server reusable utility
[] set up save to db flow and update status flow
[] set up queue/history view in sidebar

[] update and test import/export persona and target lists

generate comment success => save comment + post data
delete before submit
