// Created by DINKIssTyle on 2026.
// Copyright (C) 2026 DINKI'ssTyle. All rights reserved.

package main

import (
	"runtime"

	"github.com/wailsapp/wails/v2/pkg/menu"
)

// CreateMenu creates the application menu
func CreateMenu() *menu.Menu {
	AppMenu := menu.NewMenu()

	// macOS standard menus
	if runtime.GOOS == "darwin" {
		AppMenu.Append(menu.AppMenu())
		AppMenu.Append(menu.EditMenu())
		AppMenu.Append(menu.WindowMenu())
	}

	return AppMenu
}
