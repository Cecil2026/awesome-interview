import git_filter_repo
print([name for name in dir(git_filter_repo) if 'commit' in name.lower() or 'Commit' in name])
