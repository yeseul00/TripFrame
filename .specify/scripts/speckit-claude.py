#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
spec-kit for Claude Code
TOML 기반 spec-kit 명령어를 Claude Code에서 사용할 수 있도록 하는 도구
"""

import tomllib
import sys
import io
from pathlib import Path
from typing import Dict, Optional

# Windows에서 UTF-8 출력 지원
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class SpecKitClaude:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.commands_dir = project_root / ".gemini" / "commands"
        self.commands: Dict[str, Dict] = {}
        self._load_commands()

    def _load_commands(self):
        """모든 spec-kit TOML 파일 로드"""
        if not self.commands_dir.exists():
            raise FileNotFoundError(f"Commands directory not found: {self.commands_dir}")

        for toml_file in self.commands_dir.glob("speckit.*.toml"):
            command_name = toml_file.stem  # speckit.specify.toml -> speckit.specify
            with open(toml_file, "rb") as f:
                self.commands[command_name] = tomllib.load(f)

    def list_commands(self):
        """사용 가능한 모든 명령어 나열"""
        print("Available spec-kit commands:\n")
        for cmd, data in sorted(self.commands.items()):
            desc = data.get("description", "No description")
            print(f"  {cmd}")
            print(f"    {desc}\n")

    def get_prompt(self, command: str, args: str = "") -> Optional[str]:
        """특정 명령어의 프롬프트 가져오기"""
        if command not in self.commands:
            print(f"Error: Command '{command}' not found")
            print(f"Available commands: {', '.join(self.commands.keys())}")
            return None

        prompt = self.commands[command].get("prompt", "")
        # $ARGUMENTS 플레이스홀더를 실제 인자로 치환
        prompt = prompt.replace("$ARGUMENTS", args)
        return prompt

    def execute(self, command: str, args: str = ""):
        """명령어 실행 (프롬프트 출력)"""
        prompt = self.get_prompt(command, args)
        if prompt:
            print("=" * 80)
            print(f"spec-kit command: {command}")
            if args:
                print(f"Arguments: {args}")
            print("=" * 80)
            print()
            print(prompt)
            print()
            print("=" * 80)
            print("Copy the above prompt and paste it to Claude Code")
            print("=" * 80)

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python speckit-claude.py list")
        print("  python speckit-claude.py <command> [args]")
        print()
        print("Examples:")
        print("  python speckit-claude.py list")
        print("  python speckit-claude.py speckit.specify \"Add user authentication\"")
        print("  python speckit-claude.py speckit.plan")
        print("  python speckit-claude.py speckit.tasks")
        print("  python speckit-claude.py speckit.implement")
        sys.exit(1)

    project_root = Path(__file__).parent.parent.parent
    sk = SpecKitClaude(project_root)

    command = sys.argv[1]
    args = sys.argv[2] if len(sys.argv) > 2 else ""

    if command == "list":
        sk.list_commands()
    else:
        sk.execute(command, args)

if __name__ == "__main__":
    main()
