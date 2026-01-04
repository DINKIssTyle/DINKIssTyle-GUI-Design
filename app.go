// Created by DINKIssTyle on 2026.
// Copyright (C) 2026 DINKI'ssTyle. All rights reserved.

package main

import (
	"context"
	"encoding/json"
	"encoding/xml"
	"os"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// CanvasConfig represents the canvas settings
type CanvasConfig struct {
	Width    int    `json:"width" xml:"width"`
	Height   int    `json:"height" xml:"height"`
	Flexible bool   `json:"flexible" xml:"flexible"`
	Title    string `json:"title" xml:"title"`
}

// ElementProperties represents component-specific properties
type ElementProperties struct {
	Text        string `json:"text,omitempty" xml:"text,omitempty"`
	Placeholder string `json:"placeholder,omitempty" xml:"placeholder,omitempty"`
	Options     string `json:"options,omitempty" xml:"options,omitempty"`
	Style       string `json:"style,omitempty" xml:"style,omitempty"`
}

// GUIElement represents a single GUI component
type GUIElement struct {
	ID          string            `json:"id" xml:"id,attr"`
	Type        string            `json:"type" xml:"type"`
	Name        string            `json:"name" xml:"name"`
	Description string            `json:"description" xml:"description"`
	X           int               `json:"x" xml:"x"`
	Y           int               `json:"y" xml:"y"`
	Width       int               `json:"width" xml:"width"`
	Height      int               `json:"height" xml:"height"`
	Properties  ElementProperties `json:"properties" xml:"properties"`
}

// GUIDesign represents the complete design
type GUIDesign struct {
	XMLName  xml.Name     `json:"-" xml:"GUIDesign"`
	Canvas   CanvasConfig `json:"canvas" xml:"canvas"`
	Elements []GUIElement `json:"elements" xml:"elements>element"`
}

// App struct
type App struct {
	ctx           context.Context
	currentDesign GUIDesign
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		currentDesign: GUIDesign{
			Canvas: CanvasConfig{
				Width:    800,
				Height:   600,
				Flexible: false,
				Title:    "New Design",
			},
			Elements: []GUIElement{},
		},
	}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// GetDesign returns the current design
func (a *App) GetDesign() GUIDesign {
	return a.currentDesign
}

// SetDesign updates the current design
func (a *App) SetDesign(design GUIDesign) {
	a.currentDesign = design
}

// ExportJSON exports the design to a JSON file
func (a *App) ExportJSON() (string, error) {
	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export as JSON",
		DefaultFilename: "gui_design.json",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})
	if err != nil {
		return "", err
	}
	if filePath == "" {
		return "", nil
	}

	data, err := json.MarshalIndent(a.currentDesign, "", "  ")
	if err != nil {
		return "", err
	}

	err = os.WriteFile(filePath, data, 0644)
	if err != nil {
		return "", err
	}

	return filePath, nil
}

// ExportXML exports the design to an XML file
func (a *App) ExportXML() (string, error) {
	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export as XML",
		DefaultFilename: "gui_design.xml",
		Filters: []runtime.FileFilter{
			{DisplayName: "XML Files", Pattern: "*.xml"},
		},
	})
	if err != nil {
		return "", err
	}
	if filePath == "" {
		return "", nil
	}

	data, err := xml.MarshalIndent(a.currentDesign, "", "  ")
	if err != nil {
		return "", err
	}

	header := []byte(xml.Header)
	fullData := append(header, data...)

	err = os.WriteFile(filePath, fullData, 0644)
	if err != nil {
		return "", err
	}

	return filePath, nil
}

// SaveDesign saves the design to a file
func (a *App) SaveDesign() (string, error) {
	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save Design",
		DefaultFilename: "design.guidesign",
		Filters: []runtime.FileFilter{
			{DisplayName: "GUI Design Files", Pattern: "*.guidesign"},
		},
	})
	if err != nil {
		return "", err
	}
	if filePath == "" {
		return "", nil
	}

	data, err := json.MarshalIndent(a.currentDesign, "", "  ")
	if err != nil {
		return "", err
	}

	err = os.WriteFile(filePath, data, 0644)
	if err != nil {
		return "", err
	}

	return filePath, nil
}

// LoadDesign loads a design from a file
func (a *App) LoadDesign() (*GUIDesign, error) {
	filePath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Open Design",
		Filters: []runtime.FileFilter{
			{DisplayName: "GUI Design Files", Pattern: "*.guidesign"},
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})
	if err != nil {
		return nil, err
	}
	if filePath == "" {
		return nil, nil
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	var design GUIDesign
	err = json.Unmarshal(data, &design)
	if err != nil {
		return nil, err
	}

	a.currentDesign = design
	return &design, nil
}

// NewDesign creates a new empty design
func (a *App) NewDesign() GUIDesign {
	a.currentDesign = GUIDesign{
		Canvas: CanvasConfig{
			Width:    800,
			Height:   600,
			Flexible: false,
			Title:    "New Design",
		},
		Elements: []GUIElement{},
	}
	return a.currentDesign
}
