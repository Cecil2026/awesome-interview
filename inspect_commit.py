import git_filter_repo
from git_filter_repo import Commit
print([name for name in dir(Commit) if 'id' in name.lower() or 'sha' in name.lower()])
print([name for name in dir(Commit) if name in ('id','original_id','sha')])
