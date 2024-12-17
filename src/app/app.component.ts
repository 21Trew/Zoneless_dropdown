import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DropdownListComponent } from './components/dropdown-list/dropdown-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DropdownListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'angular-zoneless-task';
}
