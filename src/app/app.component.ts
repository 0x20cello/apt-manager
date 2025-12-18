import { Component, inject, signal, computed, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApartmentService } from './services/apartment.service';
import { Apartment, Room, Expense, ExpenseCadence, ApartmentMetrics } from './models/apartment.model';

@Component({
    selector: 'app-root',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule],
    template: `
    <div class="app-container">
      <header class="header">
        <h1>Apartment Manager</h1>
        <p class="subtitle">Track your properties, rooms, and finances in real-time</p>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportData()">
            <span class="icon">📥</span> Export JSON
          </button>
          <button class="btn-secondary" (click)="triggerImport()">
            <span class="icon">📤</span> Import JSON
          </button>
          <input
            type="file"
            #fileInput
            accept=".json"
            (change)="importData($event)"
            style="display: none;"
          />
        </div>
      </header>

      <section class="add-apartment-section">
        <div class="input-group">
          <input
            type="text"
            [(ngModel)]="newApartmentName"
            placeholder="Enter apartment name..."
            (keydown.enter)="addApartment()"
          />
          <button class="btn-primary" (click)="addApartment()" [disabled]="!newApartmentName().trim()">
            <span class="icon">+</span> Add Apartment
          </button>
        </div>
      </section>

      @if (apartments().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🏢</div>
          <h3>No apartments yet</h3>
          <p>Add your first apartment to get started</p>
        </div>
      }

      <div class="apartments-grid">
        @for (apartment of apartments(); track apartment.id) {
          <article class="apartment-card">
            <header class="apartment-header">
              <div class="apartment-title-row">
                <input
                  type="text"
                  class="apartment-name-input"
                  [value]="apartment.name"
                  (blur)="updateApartmentName(apartment.id, $event)"
                  (keydown.enter)="blurTarget($event)"
                />
                <button class="btn-delete" (click)="removeApartment(apartment.id)" title="Delete apartment">
                  ✕
                </button>
              </div>
            </header>

            <div class="apartment-content">
              <section class="metrics-section">
                @let metrics = getMetrics(apartment);
                <div class="metrics-grid">
                  <div class="metric-card revenue">
                    <span class="metric-label">Monthly Revenue</span>
                    <span class="metric-value">{{ formatCurrency(metrics.monthlyRevenue) }}</span>
                    @if (metrics.minMonthlyRevenue !== metrics.maxMonthlyRevenue) {
                      <span class="metric-range">{{ formatCurrency(metrics.minMonthlyRevenue) }} - {{ formatCurrency(metrics.maxMonthlyRevenue) }}</span>
                    }
                  </div>
                  <div class="metric-card revenue">
                    <span class="metric-label">Yearly Revenue</span>
                    <span class="metric-value">{{ formatCurrency(metrics.yearlyRevenue) }}</span>
                    @if (metrics.minYearlyRevenue !== metrics.maxYearlyRevenue) {
                      <span class="metric-range">{{ formatCurrency(metrics.minYearlyRevenue) }} - {{ formatCurrency(metrics.maxYearlyRevenue) }}</span>
                    }
                  </div>
                  <div class="metric-card costs">
                    <span class="metric-label">Monthly Costs</span>
                    <span class="metric-value">{{ formatCurrency(metrics.monthlyCosts) }}</span>
                  </div>
                  <div class="metric-card costs">
                    <span class="metric-label">Yearly Costs</span>
                    <span class="metric-value">{{ formatCurrency(metrics.yearlyCosts) }}</span>
                  </div>
                  <div class="metric-card profit" [class.negative]="metrics.monthlyProfit < 0">
                    <span class="metric-label">Monthly Profit</span>
                    <span class="metric-value">{{ formatCurrency(metrics.monthlyProfit) }}</span>
                    @if (metrics.minMonthlyProfit !== metrics.maxMonthlyProfit) {
                      <span class="metric-range">{{ formatCurrency(metrics.minMonthlyProfit) }} - {{ formatCurrency(metrics.maxMonthlyProfit) }}</span>
                    }
                  </div>
                  <div class="metric-card profit" [class.negative]="metrics.yearlyProfit < 0">
                    <span class="metric-label">Yearly Profit</span>
                    <span class="metric-value">{{ formatCurrency(metrics.yearlyProfit) }}</span>
                    @if (metrics.minYearlyProfit !== metrics.maxYearlyProfit) {
                      <span class="metric-range">{{ formatCurrency(metrics.minYearlyProfit) }} - {{ formatCurrency(metrics.maxYearlyProfit) }}</span>
                    }
                  </div>
                </div>
              </section>

              <section class="rooms-section">
                <div class="section-header">
                  <h3>Rooms</h3>
                  <button class="btn-add-small" (click)="openRoomForm(apartment.id)">+ Add Room</button>
                </div>

                @if (addingRoomFor() === apartment.id) {
                  <div class="add-form">
                    <input type="text" [(ngModel)]="newRoomName" placeholder="Room name" />
                    <div class="rent-inputs">
                      <input type="number" [(ngModel)]="newRoomRentMin" placeholder="Min rent" min="0" />
                      <span class="separator">-</span>
                      <input type="number" [(ngModel)]="newRoomRentMax" placeholder="Max rent" min="0" />
                    </div>
                    <div class="form-actions">
                      <button class="btn-confirm" (click)="addRoom(apartment.id)">Add</button>
                      <button class="btn-cancel" (click)="closeRoomForm()">Cancel</button>
                    </div>
                  </div>
                }

                @if (apartment.rooms.length === 0) {
                  <p class="empty-list">No rooms added yet</p>
                } @else {
                  <div class="rooms-list">
                    @for (room of apartment.rooms; track room.id) {
                      <div class="room-item" [class.taken]="room.isTaken">
                        <div class="room-info">
                          <input
                            type="text"
                            class="inline-edit"
                            [value]="room.name"
                            (blur)="updateRoomName(apartment.id, room.id, $event)"
                            (keydown.enter)="blurTarget($event)"
                          />
                          <div class="rent-display">
                            <input
                              type="number"
                              class="inline-number"
                              [value]="room.rentMin"
                              (blur)="updateRoomRentMin(apartment.id, room.id, $event)"
                              (keydown.enter)="blurTarget($event)"
                              min="0"
                            />
                            <span>-</span>
                            <input
                              type="number"
                              class="inline-number"
                              [value]="room.rentMax"
                              (blur)="updateRoomRentMax(apartment.id, room.id, $event)"
                              (keydown.enter)="blurTarget($event)"
                              min="0"
                            />
                            <span class="currency">AED/mo</span>
                          </div>
                        </div>
                        <div class="room-actions">
                          <label class="checkbox-label">
                            <input
                              type="checkbox"
                              [checked]="room.isTaken"
                              (change)="toggleRoomTaken(apartment.id, room.id, room.isTaken)"
                            />
                            <span class="checkbox-text">Taken</span>
                          </label>
                          <button class="btn-delete-small" (click)="removeRoom(apartment.id, room.id)">✕</button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </section>

              <section class="expenses-section">
                <div class="section-header">
                  <h3>Expenses</h3>
                  <button class="btn-add-small" (click)="openExpenseForm(apartment.id)">+ Add Expense</button>
                </div>

                @if (addingExpenseFor() === apartment.id) {
                  <div class="add-form">
                    <input type="text" [(ngModel)]="newExpenseName" placeholder="Expense name" />
                    <div class="expense-inputs">
                      <input type="number" [(ngModel)]="newExpenseAmount" placeholder="Amount" min="0" />
                      <select [(ngModel)]="newExpenseCadence">
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div class="form-actions">
                      <button class="btn-confirm" (click)="addExpense(apartment.id)">Add</button>
                      <button class="btn-cancel" (click)="closeExpenseForm()">Cancel</button>
                    </div>
                  </div>
                }

                @if (apartment.expenses.length === 0) {
                  <p class="empty-list">No expenses added yet</p>
                } @else {
                  <div class="expenses-list">
                    @for (expense of apartment.expenses; track expense.id) {
                      <div class="expense-item">
                        <div class="expense-info">
                          <input
                            type="text"
                            class="inline-edit"
                            [value]="expense.name"
                            (blur)="updateExpenseName(apartment.id, expense.id, $event)"
                            (keydown.enter)="blurTarget($event)"
                          />
                          <div class="expense-amount">
                            <input
                              type="number"
                              class="inline-number"
                              [value]="expense.amount"
                              (blur)="updateExpenseAmount(apartment.id, expense.id, $event)"
                              (keydown.enter)="blurTarget($event)"
                              min="0"
                            />
                            <select
                              [value]="expense.cadence"
                              (change)="updateExpenseCadence(apartment.id, expense.id, $event)"
                            >
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>
                        </div>
                        <button class="btn-delete-small" (click)="removeExpense(apartment.id, expense.id)">✕</button>
                      </div>
                    }
                  </div>
                }
              </section>
            </div>
          </article>
        }
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
    }

    .app-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
      animation: fadeInDown 0.6s ease-out;
    }

    .header h1 {
      font-size: 3rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.02em;
    }

    .subtitle {
      color: #8892b0;
      font-size: 1.1rem;
      margin: 0 0 1.5rem 0;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1.5rem;
    }

    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 10px;
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      font-size: 0.9rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: rgba(102, 126, 234, 0.2);
      border-color: #667eea;
      transform: translateY(-1px);
    }

    .add-apartment-section {
      margin-bottom: 2rem;
      animation: fadeInUp 0.6s ease-out 0.1s both;
    }

    .input-group {
      display: flex;
      gap: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .input-group input {
      flex: 1;
      padding: 1rem 1.5rem;
      border: 2px solid #2a2a4a;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.03);
      color: #e6e6e6;
      font-size: 1rem;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .input-group input:focus {
      outline: none;
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.05);
    }

    .input-group input::placeholder {
      color: #5a5a7a;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 1rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .icon {
      font-size: 1.2rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #8892b0;
      animation: fadeIn 0.6s ease-out;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      color: #ccd6f6;
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      margin: 0;
    }

    .apartments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 2rem;
    }

    .apartment-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      overflow: hidden;
      animation: fadeInUp 0.5s ease-out;
      transition: all 0.3s ease;
    }

    .apartment-card:hover {
      border-color: rgba(102, 126, 234, 0.3);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .apartment-header {
      padding: 1.5rem;
      background: rgba(102, 126, 234, 0.08);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .apartment-title-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .apartment-name-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #ccd6f6;
      font-size: 1.5rem;
      font-weight: 600;
      font-family: inherit;
      padding: 0.25rem;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .apartment-name-input:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .apartment-name-input:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.08);
    }

    .btn-delete {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      background: rgba(255, 107, 107, 0.1);
      color: #ff6b6b;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-delete:hover {
      background: rgba(255, 107, 107, 0.2);
      transform: scale(1.05);
    }

    .apartment-content {
      padding: 1.5rem;
    }

    .metrics-section {
      margin-bottom: 1.5rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .metric-card {
      padding: 1rem;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .metric-card.revenue {
      background: rgba(46, 213, 115, 0.08);
      border: 1px solid rgba(46, 213, 115, 0.15);
    }

    .metric-card.costs {
      background: rgba(255, 159, 67, 0.08);
      border: 1px solid rgba(255, 159, 67, 0.15);
    }

    .metric-card.profit {
      background: rgba(102, 126, 234, 0.08);
      border: 1px solid rgba(102, 126, 234, 0.15);
    }

    .metric-card.profit.negative {
      background: rgba(255, 107, 107, 0.08);
      border: 1px solid rgba(255, 107, 107, 0.15);
    }

    .metric-label {
      font-size: 0.75rem;
      color: #8892b0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      color: #ccd6f6;
    }

    .metric-card.revenue .metric-value { color: #2ed573; }
    .metric-card.costs .metric-value { color: #ff9f43; }
    .metric-card.profit .metric-value { color: #667eea; }
    .metric-card.profit.negative .metric-value { color: #ff6b6b; }

    .metric-range {
      font-size: 0.7rem;
      color: #5a5a7a;
      font-family: 'JetBrains Mono', monospace;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h3 {
      color: #ccd6f6;
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
    }

    .btn-add-small {
      padding: 0.5rem 1rem;
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 8px;
      background: transparent;
      color: #667eea;
      font-size: 0.85rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-add-small:hover {
      background: rgba(102, 126, 234, 0.1);
      border-color: #667eea;
    }

    .rooms-section, .expenses-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .add-form {
      background: rgba(102, 126, 234, 0.05);
      border: 1px solid rgba(102, 126, 234, 0.2);
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .add-form input, .add-form select {
      padding: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.03);
      color: #e6e6e6;
      font-size: 0.9rem;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .add-form input:focus, .add-form select:focus {
      outline: none;
      border-color: #667eea;
    }

    .add-form input::placeholder {
      color: #5a5a7a;
    }

    .rent-inputs, .expense-inputs {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .rent-inputs input {
      flex: 1;
    }

    .expense-inputs input {
      flex: 1;
    }

    .expense-inputs select {
      width: 120px;
    }

    .separator {
      color: #5a5a7a;
    }

    .form-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .btn-confirm {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-confirm:hover {
      transform: translateY(-1px);
    }

    .btn-cancel {
      padding: 0.5rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: transparent;
      color: #8892b0;
      font-size: 0.85rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-cancel:hover {
      border-color: rgba(255, 255, 255, 0.2);
      color: #ccd6f6;
    }

    .empty-list {
      color: #5a5a7a;
      font-size: 0.9rem;
      text-align: center;
      padding: 1rem;
      margin: 0;
    }

    .rooms-list, .expenses-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .room-item, .expense-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      transition: all 0.2s ease;
    }

    .room-item:hover, .expense-item:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    .room-item.taken {
      background: rgba(46, 213, 115, 0.05);
      border-color: rgba(46, 213, 115, 0.2);
    }

    .room-info, .expense-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .inline-edit {
      background: transparent;
      border: none;
      color: #ccd6f6;
      font-size: 0.95rem;
      font-weight: 500;
      font-family: inherit;
      padding: 0.25rem;
      border-radius: 4px;
      width: 100%;
      transition: all 0.2s ease;
    }

    .inline-edit:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .inline-edit:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.08);
    }

    .rent-display, .expense-amount {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #8892b0;
      font-size: 0.85rem;
    }

    .inline-number {
      width: 70px;
      background: transparent;
      border: none;
      color: #8892b0;
      font-size: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
      padding: 0.25rem;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .inline-number:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .inline-number:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.08);
      color: #ccd6f6;
    }

    .inline-number::-webkit-inner-spin-button,
    .inline-number::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .currency {
      color: #5a5a7a;
      font-size: 0.75rem;
    }

    .room-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #2ed573;
      cursor: pointer;
    }

    .checkbox-text {
      color: #8892b0;
      font-size: 0.85rem;
    }

    .btn-delete-small {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #5a5a7a;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-delete-small:hover {
      background: rgba(255, 107, 107, 0.1);
      color: #ff6b6b;
    }

    .expense-amount select {
      padding: 0.25rem 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.03);
      color: #8892b0;
      font-size: 0.8rem;
      font-family: inherit;
      cursor: pointer;
    }

    .expense-amount select:focus {
      outline: none;
      border-color: #667eea;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .app-container {
        padding: 1rem;
      }

      .header h1 {
        font-size: 2rem;
      }

      .header-actions {
        flex-direction: column;
        gap: 0.75rem;
      }

      .btn-secondary {
        width: 100%;
        justify-content: center;
      }

      .input-group {
        flex-direction: column;
      }

      .apartments-grid {
        grid-template-columns: 1fr;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class AppComponent {
    private apartmentService = inject(ApartmentService);

    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    apartments = this.apartmentService.apartments;

    newApartmentName = signal('');

    addingRoomFor = signal<string | null>(null);
    newRoomName = signal('');
    newRoomRentMin = signal(0);
    newRoomRentMax = signal(0);

    addingExpenseFor = signal<string | null>(null);
    newExpenseName = signal('');
    newExpenseAmount = signal(0);
    newExpenseCadence = signal<ExpenseCadence>('monthly');

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-AE', {
            style: 'currency',
            currency: 'AED',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }

    getMetrics(apartment: Apartment): ApartmentMetrics {
        return this.apartmentService.calculateMetrics(apartment);
    }

    addApartment(): void {
        const name = this.newApartmentName().trim();
        if (name) {
            this.apartmentService.addApartment(name);
            this.newApartmentName.set('');
        }
    }

    removeApartment(id: string): void {
        this.apartmentService.removeApartment(id);
    }

    updateApartmentName(id: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        this.apartmentService.updateApartmentName(id, input.value);
    }

    blurTarget(event: Event): void {
        (event.target as HTMLElement).blur();
    }

    openRoomForm(apartmentId: string): void {
        this.addingRoomFor.set(apartmentId);
        this.newRoomName.set('');
        this.newRoomRentMin.set(0);
        this.newRoomRentMax.set(0);
    }

    closeRoomForm(): void {
        this.addingRoomFor.set(null);
    }

    addRoom(apartmentId: string): void {
        const name = this.newRoomName().trim();
        if (name) {
            this.apartmentService.addRoom(apartmentId, {
                name,
                rentMin: this.newRoomRentMin(),
                rentMax: this.newRoomRentMax(),
                isTaken: false,
            });
            this.closeRoomForm();
        }
    }

    updateRoomName(apartmentId: string, roomId: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        this.apartmentService.updateRoom(apartmentId, roomId, { name: input.value });
    }

    updateRoomRentMin(apartmentId: string, roomId: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        this.apartmentService.updateRoom(apartmentId, roomId, { rentMin: +input.value });
    }

    updateRoomRentMax(apartmentId: string, roomId: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        this.apartmentService.updateRoom(apartmentId, roomId, { rentMax: +input.value });
    }

    toggleRoomTaken(apartmentId: string, roomId: string, currentValue: boolean): void {
        this.apartmentService.updateRoom(apartmentId, roomId, { isTaken: !currentValue });
    }

    removeRoom(apartmentId: string, roomId: string): void {
        this.apartmentService.removeRoom(apartmentId, roomId);
    }

    openExpenseForm(apartmentId: string): void {
        this.addingExpenseFor.set(apartmentId);
        this.newExpenseName.set('');
        this.newExpenseAmount.set(0);
        this.newExpenseCadence.set('monthly');
    }

    closeExpenseForm(): void {
        this.addingExpenseFor.set(null);
    }

    addExpense(apartmentId: string): void {
        const name = this.newExpenseName().trim();
        if (name) {
            this.apartmentService.addExpense(apartmentId, {
                name,
                amount: this.newExpenseAmount(),
                cadence: this.newExpenseCadence(),
            });
            this.closeExpenseForm();
        }
    }

    updateExpenseName(apartmentId: string, expenseId: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        this.apartmentService.updateExpense(apartmentId, expenseId, { name: input.value });
    }

    updateExpenseAmount(apartmentId: string, expenseId: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        this.apartmentService.updateExpense(apartmentId, expenseId, { amount: +input.value });
    }

    updateExpenseCadence(apartmentId: string, expenseId: string, event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.apartmentService.updateExpense(apartmentId, expenseId, { cadence: select.value as ExpenseCadence });
    }

    removeExpense(apartmentId: string, expenseId: string): void {
        this.apartmentService.removeExpense(apartmentId, expenseId);
    }

    exportData(): void {
        const data = this.apartmentService.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `apartment-manager-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    triggerImport(): void {
        this.fileInput.nativeElement.click();
    }

    importData(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content) as Apartment[];
                if (Array.isArray(data)) {
                    if (confirm('This will replace all current data. Are you sure?')) {
                        this.apartmentService.importData(data);
                        input.value = '';
                    }
                } else {
                    alert('Invalid JSON format. Expected an array of apartments.');
                }
            } catch (error) {
                alert('Error parsing JSON file. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }
}

