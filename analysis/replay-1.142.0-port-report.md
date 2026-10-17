# Port 1.141.2 -> 1.142.0: clean

Tree: /home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0-replay/work/20261017T012349289277075Z/vscode

- Rebase of 1.141.2's patches: 36 rejected hunk(s); replay of the 1.141.2 port patch: 32.
- port-rejects.mjs: 42 applied, 39 unresolved, 0 missing-file.
- Three-way merge: 13 file(s), 31 conflict(s).
- package.json hunks left to port-rules.mjs and the lock refresh: 6.
- Pruned provider modules: 14. Rules: 5 change(s).
- finalize-port-1.142.0.mjs: ok.
- Dependencies: /home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0-replay/cache/port-deps/ca2343b7e6390db9.
- Typecheck: exit 0, 0 error(s).

Steps (s): prepare-work 2, port-patches 22, replay-port 0, port-rejects-patches 0, port-rejects-replay 0, merge 1, prune 0, finalize 0, rules 0, refresh-locks 3, deps 13, typecheck 16.

Clean: port.sh exports user/zzzz-port-1.142.0.patch and probes the patch set.
